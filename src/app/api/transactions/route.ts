import { ethers } from 'ethers';

export async function GET() {
  const provider = new ethers.JsonRpcProvider('http://127.0.0.1:8545');

  const latestBlockNumber = await provider.getBlockNumber();
  const transactions = [];

  for (let i = latestBlockNumber; i > latestBlockNumber - 10; i--) {
    let block;
    try {
      block = await provider.getBlock(i);
    } catch (err) {
      console.warn(`Bloco ${i} inválido, pulando.`, err.message);
      continue;
    }

    if (!block || !block.transactions) continue;
    // block.transactions é array de hashes, precisa buscar cada tx
    for (const txHash of block.transactions) {
      const tx = await provider.getTransaction(txHash); // pega os detalhes

      const blockTimestamp = new Date(Number(block.timestamp)).toISOString();

      const blockMetadata = {
        miner: block.miner,
        difficulty: block.difficulty?.toString(),
        totalDifficulty: block.totalDifficulty?.toString(),
        size: block.size,
        gasUsed: block.gasUsed?.toString(),
        gasLimit: block.gasLimit?.toString(),
      };

      transactions.push({
        hash: tx.hash,
        from: tx.from,
        to: tx.to,
        value: tx.value.toString(),
        blockNumber: tx.blockNumber,
        timestamp: blockTimestamp, 
        blockMetadata, 
      });
    }
  }

  return new Response(JSON.stringify(transactions), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
}