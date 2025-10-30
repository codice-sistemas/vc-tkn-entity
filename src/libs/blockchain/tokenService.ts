import { ethers } from "ethers";
import { getTokenTypeName } from "../../utils/tokenUtils";

const ACCOUNT_FACTORY_ABI = [
  "event AccountCreated(address indexed owner, bytes32 indexed client, address indexed account)"
];

const COMPLIANCE_TOKEN_REGISTRY_ABI = [
  "event TokenIssued(address indexed issuer, address indexed client, uint256 tokenType, uint256 id)"
];

const provider = new ethers.JsonRpcProvider(process.env.BLOCKCHAIN_RPC_URL);

// --- Configurável: endereço do AddressDiscovery (fixo na sua rede)
const AD_ADDRESS = process.env.ADDRESS_DISCOVERY;


interface ClientData {
  client: string;
  tokens: {
    owner?: string;
    issuer?: string;
    account?: string;
    eventName?: string;
    tokenType?: string;
    id?: string;
    blockNumber: number;
    txHash: string;
  }[];
}

async function getSmartAccountAddress(hashAA: string): Promise<string | null> {
  const AD_ABI = [
    "function addressDiscovery(bytes32 key) external view returns (address)"
  ];
  const FACTORY_ABI = [
    "function getAccount(bytes32 hashClient) external view returns (address)",
  ];

  const ad = new ethers.Contract(AD_ADDRESS!, AD_ABI, provider);

  // resolve endereço do AccountFactory
  const factoryKey = ethers.keccak256(ethers.toUtf8Bytes("AccountFactory"));
  const factoryAddress = await ad.addressDiscovery(factoryKey);
  if (factoryAddress === ethers.ZeroAddress) return null;

  const factory = new ethers.Contract(factoryAddress, FACTORY_ABI, provider);
  const smartAccountAddress = await factory.getAccount(hashAA);
  if (smartAccountAddress === ethers.ZeroAddress) return null;

//  return ethers.getAddress(smartAccountAddress);
  return smartAccountAddress;
}


/**
 * Busca eventos TokenIssued e AccountCreated para um client específico,
 * varrendo a blockchain de trás pra frente e parando quando o AccountCreated é encontrado.
 */
export async function getClientEventsReversed(
  client: string,
  batchSize: number = 5000
): Promise<ClientData> {
 
//  const RPC_URL = process.env.BLOCKCHAIN_RPC_URL;
//  const provider = new ethers.JsonRpcProvider(RPC_URL);
  const latestBlock = await provider.getBlockNumber();

  const AD_ABI = [
    "function addressDiscovery(bytes32 key) external view returns (address)"
  ];

  const AD_ADDRESS = process.env.ADDRESS_DISCOVERY;

  const ad = new ethers.Contract(AD_ADDRESS!, AD_ABI, provider);
  const factoryKey = ethers.keccak256(ethers.toUtf8Bytes("AccountFactory"));
  const tokenRegistryKey = ethers.keccak256(ethers.toUtf8Bytes("ComplianceTokenRegistry"));

  let accountFactoryAddress= await ad.addressDiscovery(factoryKey);
  let complianceTokenRegistryAddress = await ad.addressDiscovery(tokenRegistryKey);
  
  const accountFactory = new ethers.Contract(
    accountFactoryAddress,
    ACCOUNT_FACTORY_ABI,
    provider
  );

  const complianceRegistry = new ethers.Contract(
    complianceTokenRegistryAddress,
    COMPLIANCE_TOKEN_REGISTRY_ABI,
    provider
  );

  // Normalização do client
  let clientKey: string;
  if (ethers.isAddress(client)) {
    clientKey = ethers.getAddress(client).toLowerCase();
  } else {
    // assume que é bytes32 (como vindo de um hash ou ID codificado)
    clientKey = (client as string).toLowerCase();
  }

  const result: ClientData = { client: clientKey, tokens: [] };

  console.log(`Buscando eventos para client ${clientKey}...`);

  let currentBlock = latestBlock;
  let accountCreatedFound = false;

  while (currentBlock > 0 && !accountCreatedFound) {
    const fromBlock = Math.max(currentBlock - batchSize + 1, 0);
    const toBlock = currentBlock;

    console.log(`Blocos ${fromBlock} → ${toBlock}`);

    // Filtro pelo client (diferente tipo para cada contrato)
    let tokenFilter, accountFilter;

    if (ethers.isAddress(client)) {
      tokenFilter = complianceRegistry.filters.TokenIssued(null, client);
      accountFilter = accountFactory.filters.AccountCreated(null, null, client);
    } else {
      throw new Error("Cliente não é um endereço valido");
    }

    // Buscar TokenIssued
    const tokenEvents = await complianceRegistry.queryFilter(tokenFilter, fromBlock, toBlock);

    for (const e of tokenEvents) {
      result.tokens.push({
        issuer: (e as any).args.issuer,
        eventName: "TokenIssued", 
        tokenType: getTokenTypeName((e as any).args.tokenType.toString()),
        id: (e as any).args.id.toString(),
        blockNumber: e.blockNumber,
        txHash: e.transactionHash,
      });
    }

    // Buscar AccountCreated
    const accountEvents = await accountFactory.queryFilter(accountFilter, fromBlock, toBlock);

    for (const e of accountEvents) {
      result.tokens.push({
        owner: (e as any).args.owner,
        eventName: "AccountCreated", 
        tokenType: "Credencial Verificável", 
        account: (e as any).args.account,
        blockNumber: e.blockNumber,
        txHash: e.transactionHash,
      });
      accountCreatedFound = true;
    }

    currentBlock = fromBlock - 1;
  }

  // Ordenar eventos do mais antigo pro mais recente
  result.tokens.sort((a, b) => a.blockNumber - b.blockNumber);

  console.log(`Busca finalizada. Encontrados ${result.tokens.length} tokens e contas.`);

  return result;
}

export async function getTokensByHashAA(hashAA: string) {
  const smartAddr = await getSmartAccountAddress(hashAA);
  if (!smartAddr) {
    console.warn("Nenhuma carteira encontrada para", hashAA);
    return [];
  }
  console.log("Carteira resolvida:", smartAddr);
  const tokens = await getClientEventsReversed(smartAddr);
  console.log(tokens);
  return safeStringify(tokens);
//  return tokens;
}

function safeStringify(obj: any) {
  return JSON.parse(JSON.stringify(obj, (key, value) =>
    typeof value === 'bigint' ? value.toString() : value
  ));
}

