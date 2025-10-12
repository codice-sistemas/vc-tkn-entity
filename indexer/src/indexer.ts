//import { PrismaClient } from "@prisma/client";

//import { ethers } from 'ethers';
const { ethers } = require('ethers');
//import prismaPkg from '@prisma/client';
//const prismaPkg = require('@prisma/client');
const { PrismaClient } = require('@prisma/client');
//var prisma = require('../../prisma');
//import fs from 'fs';
const fs = require('fs');
//import path from 'path';
const path = require('path');

//const { PrismaClient } = prismaPkg;
//const PrismaClient = prismaPkg.default;
//const prisma = global.prism
const _prisma = global.prisma ?? new PrismaClient();

const BESU = process.env.BESU_RPC_URL || 'http://127.0.0.1:8545';
const ENTRYPOINT_ADDR = process.env.ENTRYPOINT_ADDRESS!;
const ENTRYPOINT_ABI_PATH = process.env.ENTRYPOINT_ABI_PATH || './abis/EntryPoint.json';

async function loadAbi() {
  const raw = fs.readFileSync(path.resolve(ENTRYPOINT_ABI_PATH), 'utf8');
  return JSON.parse(raw);
}

async function run() {
  const provider = new ethers.JsonRpcProvider(BESU);
  const abi = await loadAbi();
  const entry = new ethers.Contract(ENTRYPOINT_ADDR, abi, provider);

  let lastBlock = await provider.getBlockNumber();
  console.log('Starting indexer at block', lastBlock);

  setInterval(async () => {
    try {
      const latest = await provider.getBlockNumber();
      if (latest <= lastBlock) return;

      for (let b = lastBlock + 1; b <= latest; b++) {
        // ✅ v6: getBlock() no longer supports 'includeTransactions' boolean directly
        const block = await provider.send('eth_getBlockByNumber', [
          ethers.toBeHex(b),
          true,
        ]);

        if (!block || !block.transactions) continue;

        console.log('Indexing block', b, 'txs', block.transactions.length);

        for (const tx of block.transactions) {
          if (!tx?.hash) continue; // avoid null hash

          try {
            const receipt = await provider.getTransactionReceipt(tx.hash);
            if (!receipt?.logs) continue;

            for (const log of receipt.logs) {
              try {
                // ✅ v6: parseLog expects { topics, data }
                const parsed = entry.interface.parseLog({
                  topics: log.topics,
                  data: log.data,
                });
                if (!parsed) continue;

                const name = parsed.name;
                console.log('Found event', name, 'tx', tx.hash);

                const sender =
                  parsed.args.sender?.toString() ||
                  parsed.args.account?.toString() ||
                  null;

                let client = null;
                if (sender) {
                  client = await _prisma.client.findFirst({
                    where: { aaHash: String(sender) },
                  });
                }

                await _prisma.transaction.upsert({
                  where: { txHash: tx.hash },
                  update: {
                    blockNumber: BigInt(b),
                    status: receipt.status === 1 ? 'confirmed' : 'failed',
                    indexedAt: new Date(),
                    metadata: { event: name, args: parsed.args },
                  },
                  create: {
                    clientId: client ? client.id : 0,
                    txHash: tx.hash,
                    fromAddress: tx.from || '',
                    toAddress: tx.to || null,
                    value: tx.value?.toString?.() || '0',
                    blockNumber: BigInt(b),
                    status: receipt.status === 1 ? 'confirmed' : 'failed',
                    metadata: { event: name, args: parsed.args },
                  },
                });
              } catch (e) {
                // parseLog can throw if not matching this ABI
                continue;
              }
            }
          } catch (err) {
            console.error('Error processing tx', tx.hash, err);
          }
        }
      }

      lastBlock = latest;
    } catch (err) {
      console.error('Indexer loop error', err);
    }
  }, 3000);
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
