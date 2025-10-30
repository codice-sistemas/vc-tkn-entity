import { error } from "console";
import { ethers, Interface } from "ethers";
import fs from "fs";
import path from "path";

const provider = new ethers.JsonRpcProvider(process.env.BLOCKCHAIN_RPC_URL);

// --- Configurável: endereço do AddressDiscovery (fixo na sua rede)
//const AD_ADDRESS = "0xDc64a140Aa3E981100a9becA4E685f962f0cF6C9";
//const AD_ADDRESS = "0x5FC8d32690cc91D4c39d9d3abcBD16989F875707";
const AD_ADDRESS = process.env.ADDRESS_DISCOVERY;
// --- 1) Resolve o endereço real da carteira (smart account)
async function getSmartAccountAddress(hashAA: string): Promise<string | null> {
  const AD_ABI = [
    "function addressDiscovery(bytes32 key) external view returns (address)"
  ];
  const FACTORY_ABI = [
    "function getAccount(bytes32 hashClient) external view returns (address)",
  ];

  const ad = new ethers.Contract(AD_ADDRESS, AD_ABI, provider);

  // resolve endereço do AccountFactory
  const factoryKey = ethers.keccak256(ethers.toUtf8Bytes("AccountFactory"));
  const factoryAddress = await ad.addressDiscovery(factoryKey);
  if (factoryAddress === ethers.ZeroAddress) return null;

  const factory = new ethers.Contract(factoryAddress, FACTORY_ABI, provider);
  const smartAccountAddress = await factory.getAccount(hashAA);
  if (smartAccountAddress === ethers.ZeroAddress) return null;

  console.log(smartAccountAddress);
//  return ethers.getAddress(smartAccountAddress);
  return smartAccountAddress;
}

// --- 2) Obtém o endereço de um contrato via AddressDiscovery (Keccak256 do nome)
async function getContractAddress(name: string): Promise<string> {
//  const artifactPath = path.join(
//    process.cwd(),
//    "artifacts/contracts/AddressDiscovery.sol/AddressDiscovery.json"
//  );
//  const AD_ABI = JSON.parse(fs.readFileSync(artifactPath, "utf8")).abi;
  const AD_ABI = [
    "function addressDiscovery(bytes32 key) external view returns (address)",
//    "function getAddress(bytes32 key) external view returns (address)"
  ];
  const ad = new ethers.Contract(AD_ADDRESS, AD_ABI, provider);
  const key = ethers.keccak256(ethers.toUtf8Bytes(name));
  const addr = await ad.addressDiscovery(key);

  if (addr === ethers.ZeroAddress) {
    throw new Error(`Contrato "${name}" não encontrado no AddressDiscovery`);
  }

//  return ethers.getAddress(addr);
  return addr;
}

// --- 3) Lê eventos de token dos contratos registrados
async function getTokensForSmartAccount(
  smartAddr: string,
  fromBlock = 0
): Promise<any[]> {
  const tokenRegistryAddr = await getContractAddress("ComplianceTokenRegistry");
  console.log("Contrato de token descoberto:", tokenRegistryAddr);

  // carregar ABI geral de tokens
  const tokenAbiPath = path.resolve("./abi/all_abis.json");
  const tokenAbi = JSON.parse(fs.readFileSync(tokenAbiPath, "utf8"));
  const iface = new Interface(tokenAbi);

//  const tokenEvents = ["UpdateAddress", "AccountCreated", "TokenIssued", "TokenTransferred"];
//  const tokenEvents = ["UpdateAddress", "AccountCreated", "TokenIssued"];
  const tokenEvents = ["AccountCreated", "TokenIssued"];
  const results: any[] = [];

  for (const evName of tokenEvents) {
    let topic: string;
    try {
      topic = iface.getEvent(evName).topic;
    } catch {
       console.warn(`Evento não encontrado no ABI: ${evName}`);
       continue;
    }

    const logs = await provider.getLogs({
      fromBlock,
      toBlock: "latest",
      address: tokenRegistryAddr,
      topics: [topic],
    });

    for (const log of logs) {
      try {
        const parsed = iface.parseLog(log);
        const args = parsed.args;

        // verifica se a carteira está envolvida (sender, to, owner, etc.)
        const involved = Object.values(args).some(
          (a) =>
            typeof a === "string" &&
            a.toLowerCase() === smartAddr.toLowerCase()
        );
        if (involved) {
          console.log(log);
          results.push({
            event: parsed.name,
            contract: tokenRegistryAddr,
            txHash: log.transactionHash,
            blockNumber: log.blockNumber.toString(),
            args,
          });
        }
      } catch {
        console.log(error);
      }
    }
  }

  return results;
}

// --- 4) Pipeline principal
export async function getTokensByHashAA(hashAA: string) {
  const smartAddr = await getSmartAccountAddress(hashAA);
  if (!smartAddr) {
    console.warn("Nenhuma carteira encontrada para", hashAA);
    return [];
  }

  console.log("Carteira resolvida:", smartAddr);
  const tokens = await getTokensForSmartAccount(smartAddr);
//  console.log(tokens);
  return safeStringify(tokens);
//  return tokens;
}

function safeStringify(obj) {
  return JSON.parse(JSON.stringify(obj, (key, value) =>
    typeof value === 'bigint' ? value.toString() : value
  ));
}
