// tokenService.ts
import fs from "fs";
import path from "path";
import { ethers } from "ethers";
import type { Log } from "ethers";
import { Logs } from "lucide-react";
import { error } from "console";

type TokenOut = {
  eventName: string;
  sender: string | null;
  IF: string | null;
  tokenType: string;
  tokenId?: string; 
  txHash?: string;
  blockNumber?: number;
};

// Provider
const provider = new ethers.JsonRpcProvider(process.env.BLOCKCHAIN_RPC_URL);

// Carrega ABI combinada
//const abiRaw = JSON.parse(fs.readFileSync(path.join(process.cwd(), "abi", "all_abis.json"), "utf8"));
//const abiRaw = JSON.parse(fs.readFileSync(path.join(process.cwd(), "abi/all_abis.json"), "utf8"));
const abiRaw = JSON.parse(fs.readFileSync(path.join(process.cwd(), process.env.ADDRESS_ALL_ABI), "utf8"));
const allAbi = Array.isArray(abiRaw) ? abiRaw : abiRaw;
const iface = new ethers.Interface(allAbi);

// Lista de event fragments para fallback
const eventFragments = allAbi
  .filter((x: any) => x?.type === "event")
  .map((ev: any) => {
    try {
      return ethers.EventFragment.from(ev);
    } catch {
      return null;
    }
  })
  .filter(Boolean) as ethers.EventFragment[];

// Heurística para extrair campos de qualquer evento
function extractFieldsFromArgs(name: string, args: any): TokenOut {
  const get = (names: string[]) => {
    for (const n of names) {
      if (Object.prototype.hasOwnProperty.call(args, n)) return args[n];
    }
    return undefined;
  };

//  const senderRaw = get(["from", "issuer", "sender", "owner", "creator"]);
  const senderRaw = get(["from", "issuer", "sender", "owner", "creator", "event", "name"]);
  const ifRaw = get(["to", "IF", "recipient", "account"]);
  const tokenTypeRaw = get(["tokenType", "type", "classCode", "code", "token_class"]);
  const tokenIdRaw = get(["id", "tokenId"]);

  return {
    eventName: name || "Unknown",
    sender: senderRaw ? String(senderRaw) : null,
    IF: ifRaw ? String(ifRaw) : null,
    tokenType: tokenTypeRaw ? String(tokenTypeRaw) : "0",
    tokenId: tokenIdRaw ? String(tokenIdRaw) : undefined
  };
}

// Fallback manual para logs não parseáveis
function fallbackFromLog(log: Log): TokenOut {
  const sender = log.topics?.[1] ? "0x" + log.topics[1].slice(-40) : null;
  let tokenType = "0";
  let tokenId: string | undefined = undefined;
  let IF: string | null = null;

  if (log.data && log.data !== "0x") {
    const d = log.data.slice(2);
    const f1 = d.slice(0, 64);
    const f2 = d.slice(64, 128);
    const f3 = d.slice(128, 192);
    try { tokenType = f1 ? BigInt("0x" + f1).toString() : "0"; } catch {}
    IF = f2 ? "0x" + f2.slice(24) : null;
    tokenId = f3 ? BigInt("0x" + f3).toString() : undefined;
  }

  return { eventName: "Unknown", sender, IF, tokenType, tokenId };
}

// Função principal
export async function getTokensByHashAA(hashAA: string, fromBlock = 0): Promise<TokenOut[]> {
  const normalizedHash = hashAA.startsWith("0x") ? hashAA.toLowerCase() : "0x" + hashAA.toLowerCase();

  // === Descobrir SmartAccount via AddressDiscovery / AccountFactory ===
//  const AD_ADDRESS = "0xDc64a140Aa3E981100a9becA4E685f962f0cF6C9"; // AddressDiscovery fixo
//  const AD_ADDRESS = "0x5FC8d32690cc91D4c39d9d3abcBD16989F875707";
  const AD_ADDRESS = process.env.ADDRESS_DISCOVERY;
  let smartAccountAddress: string | null = null;

  const AD_ARTIFACT = JSON.parse(fs.readFileSync(
//      path.join(process.cwd(), "artifacts/contracts/AddressDiscovery.sol/AddressDiscovery.json"), "utf8"));
//      path.join(process.cwd(), process.env.ADDRESS_ARTIFACT_ADDRESS_DISCOVERY), "utf8"));
//      path.join(process.cwd(), "artifacts/contracts/ComplianceTokenRegistry.sol/ComplianceTokenRegistry.json"), "utf8"));
    path.join(process.cwd(), process.env.ADDRESS_ARTIFACT_COMPLIANCE_TOKEN_REGISTRY), "utf8"));

    try {

    const adIface = new ethers.Interface(AD_ARTIFACT.abi);
//    const updateTopic = adIface.getEvent("UpdateAddress").topic;
    const updateTopic = adIface.getEvent("TokenIssued").topic;

    // Logs UpdateAddress
    const adLogs = await provider.getLogs({ fromBlock, toBlock: "latest", address: AD_ADDRESS, topics: [updateTopic] });

    let factoryAddress: string | null = null;
    for (const l of adLogs) {
      try {
//        const parsed = adIface.decodeEventLog("UpdateAddress", l.data, l.topics);
        const parsed = adIface.decodeEventLog("TokenIssued", l.data, l.topics);
        if (parsed.key === ethers.keccak256(ethers.toUtf8Bytes("AccountFactory"))) {
          factoryAddress = parsed.newAddress;
          break;
        }
      } catch { }
    }

    if (factoryAddress) {
      const FACTORY_ABI = ["function getAccount(bytes32 hashClient) external view returns (address)"];
      const factory = new ethers.Contract(factoryAddress, FACTORY_ABI, provider);
      smartAccountAddress = await factory.getAccount(normalizedHash);
      if (smartAccountAddress === ethers.ZeroAddress) smartAccountAddress = null;
    }
  } catch (err) {
    console.warn("Falha ao obter SmartAccount via AddressDiscovery:", (err as any).message || err);
  }

  // Se hashAA é endereço, use como fallback
  if (!smartAccountAddress && /^0x[0-9a-f]{40}$/.test(normalizedHash)) {
    smartAccountAddress = normalizedHash;
  }

  // === Descobrir candidate contracts ===
  const candidateAddresses: string[] = [];
  try {

    const adIface = new ethers.Interface(AD_ARTIFACT.abi);
//    const updateTopic = adIface.getEvent("UpdateAddress").topic;
    const updateTopic = adIface.getEvent("TokenIssued").topic;

    const adLogs = await provider.getLogs({ fromBlock, toBlock: "latest", address: AD_ADDRESS, topics: [updateTopic] });
    const addrsSet = new Set<string>();

    for (const l of adLogs) {
      let addr: string | null = null;
      try {
//        const parsed = adIface.decodeEventLog("UpdateAddress", l.data, l.topics);
        const parsed = adIface.decodeEventLog("TokenIssued", l.data, l.topics);
        addr = parsed.newAddress;
      } catch {
        console.log("caiu no catch", error); 
        if (l.data && l.data.length >= 66) {
          try { addr = ethers.getAddress("0x" + l.data.slice(-40)); } catch { addr = null; }
        }
      }
      if (addr && addr !== ethers.ZeroAddress) addrsSet.add(addr);
    }

    candidateAddresses.push(...Array.from(addrsSet));
  } catch { }

  // === Buscar logs nos contratos candidatos ===
  const results: TokenOut[] = [];
  const ifaceAll = iface;

  const accountCheck = (log: Log) => {
    const targetAddr = smartAccountAddress ? smartAccountAddress.toLowerCase().replace(/^0x/, "") : null;
    const targetHash = normalizedHash.replace(/^0x/, "");
    if (targetAddr) {
      if (log.topics?.some(t => t && t.toLowerCase().endsWith(targetAddr))) return true;
      if (typeof log.data === "string" && log.data.toLowerCase().includes(targetAddr)) return true;
    }
    if (typeof log.data === "string" && log.data.toLowerCase().includes(targetHash)) return true;
    if (log.topics?.some(t => t?.toLowerCase().includes(targetHash))) return true;
    return false;
  };
  const processLogs = (logsBatch: Log[]) => {
    for (const log of logsBatch) {
      if (!accountCheck(log)) continue;

      try {
        const parsed = ifaceAll.parseLog(log);
        const out = extractFieldsFromArgs(parsed.name || "Unknown", parsed.args);
        out.txHash = log.transactionHash;
        out.blockNumber = log.blockNumber;
        results.push(out);
        console.log(log);

        continue;
      } catch { }

      let matched = false;
      for (const frag of eventFragments) {
        try {
          const decoded = ifaceAll.decodeEventLog(frag, log.data, log.topics);
          const hasHash = Object.values(decoded).some((a: any) => {
            if (!a) return false;
            const s = String(a).toLowerCase();
            return s.includes(normalizedHash.replace(/^0x/, "")) || (smartAccountAddress && s.includes(smartAccountAddress.replace(/^0x/, "").toLowerCase()));
          });
          if (!hasHash) continue;
          const out = extractFieldsFromArgs(frag.name || "Unknown", decoded);
          out.txHash = log.transactionHash;
          out.blockNumber = log.blockNumber;
          results.push(out);
          matched = true;
          break;
        } catch { }
      }
      if (matched) continue;

      try {
        const fb = fallbackFromLog(log);
        if ([fb.sender, fb.IF, fb.tokenType, fb.tokenId].some(v => v && (v.toLowerCase().includes(normalizedHash.replace(/^0x/, "")) || (smartAccountAddress && v.toLowerCase().includes(smartAccountAddress.toLowerCase().slice(2)))))) {
          fb.txHash = log.transactionHash;
          fb.blockNumber = log.blockNumber;
          results.push(fb);
        }
      } catch { }
    }
  };

  if (candidateAddresses.length > 0) {
    for (const addr of candidateAddresses) {
      try {
        const logs = await provider.getLogs({ fromBlock, toBlock: "latest", address: addr });
        processLogs(logs as Log[]);
      } catch { }
    }
  } else {
    try {
      const logs = await provider.getLogs({ fromBlock, toBlock: "latest" });
      processLogs(logs as Log[]);
    } catch (err) {
      console.error("Erro ao buscar logs globalmente:", (err as any).message || err);
    }
  }

  // Dedup
  const uniq = new Map<string, TokenOut>();
  for (const r of results) {
    const key = `${r.txHash || ""}#${r.eventName}#${r.sender || ""}#${r.IF || ""}#${r.tokenType || ""}#${r.tokenId || ""}`;
    if (!uniq.has(key)) uniq.set(key, r);
  }

  return Array.from(uniq.values());
}
