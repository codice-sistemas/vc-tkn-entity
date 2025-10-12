import { ethers } from 'ethers';
import fs from 'fs';
import path from 'path';

export function createProvider() {
  const url = process.env.BESU_RPC_URL || 'http://127.0.0.1:8545';
  return new ethers.JsonRpcProvider(url);
}

export function loadAbi(abiPath?: string) {
  const p = abiPath || process.env.ENTRYPOINT_ABI_PATH;
  if (!p) return null;
  const full = path.resolve(p);
  const raw = fs.readFileSync(full, 'utf8');
  return JSON.parse(raw);
}

export function getEntryPointContract(provider: ethers.JsonRpcProvider) {
  const addr = process.env.ENTRYPOINT_ADDRESS;
  if (!addr) throw new Error('ENTRYPOINT_ADDRESS not defined');
  const abi = loadAbi();
  if (!abi) throw new Error('ENTRYPOINT_ABI_PATH not defined or ABI missing');
  return new ethers.Contract(addr, abi, provider);
}

export async function getTxReceipt(txHash: string) {
  const provider = createProvider();
  return provider.getTransactionReceipt(txHash);
}