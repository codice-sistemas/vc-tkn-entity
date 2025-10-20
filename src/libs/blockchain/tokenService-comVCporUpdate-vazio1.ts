
import { Interface, ethers } from "ethers";
import fs from "fs";
import path from "path";
import type { Log } from "ethers";

type TokenOut = {
  eventName: string;
  sender: string | null;
  IF: string | null;
  tokenType: string;
  tokenId?: string; // captura ID se existir
  txHash?: string;
  blockNumber?: number;
};
const provider = new ethers.JsonRpcProvider(process.env.BLOCKCHAIN_RPC_URL);

const AD_ABI = [
  "function addressDiscovery(bytes32 kekkakKey) external view returns (address)"
];

const FACTORY_ABI = [
  "function getAccount(bytes32 hashClient) external view returns (address)"
];

const abiRaw = JSON.parse(fs.readFileSync(path.join(process.cwd(), "abi", "all_abis.json"), "utf8"));
const allAbi = Array.isArray(abiRaw) ? abiRaw : abiRaw;
const ifaceAll = new ethers.Interface(allAbi);

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


async function discoverAddressDiscovery() {
  const artifactPath = path.join(process.cwd(), "artifacts/contracts/AddressDiscovery.sol/AddressDiscovery.json");
  const AddressDiscoveryArtifact = JSON.parse(fs.readFileSync(artifactPath, "utf8"));

  const iface1 = new Interface(AddressDiscoveryArtifact.abi);
  
  // Ethers v6: pegar o tópico de evento
  const eventTopic = iface1.getEvent("UpdateAddress").topic;

  // Agora você pode usar na query de logs
  const logs = await provider.getLogs({
    fromBlock: 0,
    toBlock: "latest",
    topics: [eventTopic],
  });

  if (logs.length > 0) {
    console.log("AddressDiscovery found via event:", logs[0].address);
    return logs[0].address;
  }
   
  return null;
}

function extractFieldsFromArgs(name: string, args: any): TokenOut {
  const get = (names: string[]) => {
    for (const n of names) {
      if (Object.prototype.hasOwnProperty.call(args, n)) return args[n];
    }
    return undefined;
  };

  const senderRaw = get(["from", "issuer", "sender", "owner", "creator"]);
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

export async function getTokensByHashAA(hashAA: string, fromBlock = 0): Promise<TokenOut[]> {
  const normalizedHash = hashAA.startsWith("0x") ? hashAA.toLowerCase() : "0x" + hashAA.toLowerCase();

  // 1) Descobrir AddressDiscovery — usa sua função existente se presente; se preferir, fixe AD_ADDRESS aqui.
  let AD_ADDRESS: string | null = null;
/*
  try {
    if (typeof discoverAddressDiscovery === "function") {
      AD_ADDRESS = await discoverAddressDiscovery();
    }
  } catch (e) {
    AD_ADDRESS = null;
  }
*/
  // Se você já sabe o AD_ADDRESS, pode forçar aqui (descomente e ajuste):
//  AD_ADDRESS = "0xDc64a140Aa3E981100a9becA4E685f962f0cF6C9";
  AD_ADDRESS = "0x5FC8d32690cc91D4c39d9d3abcBD16989F875707";

  if (!AD_ADDRESS) {
    console.warn("AddressDiscovery não encontrado automaticamente — buscando logs globalmente (mais lento).");
  }

  // 2) Se tivermos AD_ADDRESS, pega AccountFactory via AddressDiscovery
  let smartAccountAddress: string | null = null;
  try {
    if (AD_ADDRESS) {
      const AD_MINIMAL_ABI = [
        "function addressDiscovery(bytes32 key) external view returns (address)"
      ];
      const ad = new ethers.Contract(AD_ADDRESS, AD_MINIMAL_ABI, provider);
      const factoryKey = ethers.keccak256(ethers.toUtf8Bytes("AccountFactory"));
      const factoryAddress = await ad.addressDiscovery(factoryKey);
      if (factoryAddress && factoryAddress !== ethers.ZeroAddress) {
        const FACTORY_ABI = ["function getAccount(bytes32 hashClient) external view returns (address)"];
        const factory = new ethers.Contract(factoryAddress, FACTORY_ABI, provider);
        // hashAA aqui é o hash abstrato que o factory entende (assuma que é o mesmo que você passou)
        smartAccountAddress = await factory.getAccount(normalizedHash);
        if (smartAccountAddress && smartAccountAddress === ethers.ZeroAddress) {
          // zeroAddress -> não existe
          smartAccountAddress = null;
        }
      } else {
        console.warn("AccountFactory não registrado no AddressDiscovery (ou é ZeroAddress).");
      }
    }
  } catch (err) {
    console.warn("Falha ao obter SmartAccount via factory:", (err as any).message || err);
    smartAccountAddress = null;
  }

  // 3) Se não obteve smartAccount, tenta interpretar hashAA como endereço direto (caso o usuário já passe a VC)
  console.log("hashAA: {}", hashAA);
  console.log("hashVC: {}", smartAccountAddress);
  if (!smartAccountAddress) {
    // Se hashAA tem formato de endereço, use diretamente
    const maybeAddr = normalizedHash;
    if (/^0x[0-9a-f]{40}$/.test(maybeAddr)) {
      smartAccountAddress = maybeAddr;
    }
  }

  // 4) Construir lista de contratos candidatos para buscar logs.
  //    Se tivermos AD_ADDRESS, vamos extrair todos os endereços registrados no AddressDiscovery (UpdateAddress)
  let candidateAddresses: string[] = [];
  if (AD_ADDRESS) {
    try {
      // carregar artifact ABI (se tiver)
      const artifactPath = path.join(process.cwd(), "artifacts/contracts/AddressDiscovery.sol/AddressDiscovery.json");
      const AddressDiscoveryArtifact = JSON.parse(fs.readFileSync(artifactPath, "utf8"));
      const adIface = new ethers.Interface(AddressDiscoveryArtifact.abi);
      const updateTopic = adIface.getEvent("UpdateAddress").topic;

      const adLogs = await provider.getLogs({
        fromBlock,
        toBlock: "latest",
        address: AD_ADDRESS,
        topics: [updateTopic]
      });

      const addrsSet = new Set<string>();
      for (const l of adLogs) {
        // key em topics[1], address em data (últimos 20 bytes) — porém alguns deployments podem variar; decode com cuidado
        let addr: string | null = null;
        try {
          const parsed = adIface.decodeEventLog("UpdateAddress", l.data, l.topics);
          addr = parsed.newAddress;
        } catch {
          // fallback manual: data possui 32 bytes, endereço nos últimos 20 bytes
          if (l.data && l.data.length >= 66) {
            const a = "0x" + l.data.slice(-40);
            try { addr = ethers.getAddress(a); } catch { addr = null; }
          }
        }
        if (addr && addr !== ethers.ZeroAddress) {
          // opcional: garantir que realmente exista código (é contrato)
          try {
            const code = await provider.getCode(addr);
            if (code && code !== "0x") addrsSet.add(ethers.getAddress(addr));
          } catch {
            // ignore provider.getCode errors
            addrsSet.add(ethers.getAddress(addr));
          }
        }
      }
      candidateAddresses = Array.from(addrsSet);
    } catch (err) {
      console.warn("Não foi possível extrair candidateAddresses do AddressDiscovery:", (err as any).message || err);
      candidateAddresses = [];
    }
  }

  // Se não obtivemos candidatos, deixamos candidateAddresses vazio => vamos buscar globalmente (ineficiente)
  if (candidateAddresses.length === 0) {
    console.warn("Nenhum contrato candidato identificado — buscando globalmente (alto custo).");
  }

  // 5) Buscar logs:
  // - Se candidateAddresses não vazio, fazemos várias chamadas getLogs paginadas por blocos/contratos.
  // - Caso contrário, fazemos um getLogs global (pior caso) e filtramos localmente.
  const results: TokenOut[] = [];
  const iface = new ethers.Interface(allAbi);
  const ifaceAll = iface; // seu iface carregado acima com allAbi

  // helper: checa se log menciona smartAccountAddress ou o hashAA (em topics ou data)
  const accountCheck = (log: Log) => {
    const targetAddr = smartAccountAddress ? smartAccountAddress.toLowerCase().replace(/^0x/, "") : null;
    const targetHash = normalizedHash.replace(/^0x/, "");
    // topics array — checar se alguma topic terminaWith address (32 bytes encoded) OR equals event signature containing hash
    if (targetAddr) {
      if (log.topics?.some(t => t && t.toLowerCase().endsWith(targetAddr))) return true;
      if (typeof log.data === "string" && log.data.toLowerCase().includes(targetAddr)) return true;
    }
    // checar hashAA também (caso logs usem hash abstrata)
    if (typeof log.data === "string" && log.data.toLowerCase().includes(targetHash)) return true;
    if (log.topics?.some(t => t?.toLowerCase().includes(targetHash))) return true;
    return false;
  };

  const tokenEventNames = ["TokenIssued", "TokenTransferred", "TokenBurned"];
  // função para processar um lote de logs
  const processLogs = (logsBatch: Log[]) => {
/*
    for (const log of logsBatch) {
      if (!accountCheck(log)) continue;

      // 1) tenta parseLog com allAbi iface
      try {
        const parsed = ifaceAll.parseLog(log);
        const out = extractFieldsFromArgs(parsed.name || "Unknown", parsed.args);
        out.txHash = log.transactionHash;
        out.blockNumber = log.blockNumber;
        results.push(out);
        continue;
      } catch {}

      // 2) tentar cada eventFragment (você já tem eventFragments array)
      let matched = false;
      for (const frag of eventFragments) {
        try {
          const decoded = ifaceAll.decodeEventLog(frag, log.data, log.topics);
          const argsObj: any = decoded;
          // checa se algum arg contém o endereço/hash
          const hasHash = Object.values(argsObj).some((a: any) => {
            if (!a) return false;
            const s = String(a).toLowerCase();
            return s.includes(normalizedHash.replace(/^0x/, "")) || (smartAccountAddress && s.includes(smartAccountAddress.replace(/^0x/, "").toLowerCase()));
          });
          if (!hasHash) continue;
          const out = extractFieldsFromArgs(frag.name || "Unknown", argsObj);
          out.txHash = log.transactionHash;
          out.blockNumber = log.blockNumber;
          results.push(out);
          matched = true;
          break;
        } catch {}
      }
      if (matched) continue;

      // 3) fallback manual - seu fallbackFromLog
      try {
        const fb = fallbackFromLog(log);
        if ([fb.sender, fb.IF, fb.tokenType, fb.tokenId].some(v => v && (v.toLowerCase() === normalizedHash || (smartAccountAddress && v.toLowerCase().includes(smartAccountAddress.toLowerCase().slice(2)))))) {
          fb.txHash = log.transactionHash;
          fb.blockNumber = log.blockNumber;
          results.push(fb);
        }
      } catch {}
    }
*/
    for (const log of logsBatch) {
    if (!accountCheck(log)) continue;

    let parsed: any = null;

    try {
        parsed = ifaceAll.parseLog(log);
    } catch {}

    if (parsed && tokenEventNames.includes(parsed.name)) {
        const out = extractFieldsFromArgs(parsed.name, parsed.args);
        out.txHash = log.transactionHash;
        out.blockNumber = log.blockNumber;
        results.push(out);
    }
    }      
  };

  // Executa busca e processamento
  if (candidateAddresses.length > 0) {
    // busca por cada contrato candidato (pode agrupar em batches se muitos)
    for (const addr of candidateAddresses) {
      try {
        const logs = await provider.getLogs({
          fromBlock,
          toBlock: "latest",
          address: addr
        });
        processLogs(logs as Log[]);
      } catch (err) {
        console.warn("Erro ao getLogs do contrato", addr, (err as any).message || err);
        // tenta próximo
      }
    }
  } else {
    // busca global (sem address) - altamente custoso; ideal só em rede local / anvil
    try {
      const logs = await provider.getLogs({
        fromBlock,
        toBlock: "latest"
      });
      processLogs(logs as Log[]);
    } catch (err) {
      console.error("Erro ao buscar logs globalmente:", (err as any).message || err);
    }
  }

  // Dedup por chave robusta (txHash + eventName + IF + tokenType + tokenId)
  const uniq = new Map<string, TokenOut>();
  for (const r of results) {
    const key = `${r.txHash || ""}#${r.eventName}#${r.sender || ""}#${r.IF || ""}#${r.tokenType || ""}#${r.tokenId || ""}`;
    if (!uniq.has(key)) uniq.set(key, r);
  }

  return Array.from(uniq.values());
}
