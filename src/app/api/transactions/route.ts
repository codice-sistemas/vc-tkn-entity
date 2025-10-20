import { ethers } from 'ethers';

export async function GET(req: Request) {
  const provider = new ethers.JsonRpcProvider(process.env.BLOCKCHAIN_RPC_URL);

  // Lê parâmetros de URL
  const { searchParams } = new URL(req.url);
  const page = Number(searchParams.get('page')) || 1; // página atual (default 1)
  const limit = 25; // blocos por página

  const latestBlockNumber = await provider.getBlockNumber();
  const startBlock = latestBlockNumber - (page - 1) * limit;
  const endBlock = Math.max(startBlock - limit + 1, 0); // não deixar negativo

  const transactions: any[] = [];

  // Varrendo blocos da página atual (do mais recente pro mais antigo)
  for (let i = startBlock; i >= endBlock; i--) {
    let block;
    try {
      block = await provider.getBlock(i);
    } catch {
      continue;
    }

    if (!block?.transactions) continue;

    for (const txHash of block.transactions) {
      const tx = await provider.getTransaction(txHash);
      if (!tx) continue;

      const blockTimestamp = new Date(block.timestamp * 1000).toISOString();

      transactions.push({
        hash: tx.hash,
        from: tx.from,
        to: tx.to,
        value: tx.value.toString(),
        blockNumber: tx.blockNumber,
        timestamp: blockTimestamp,
      });
    }
  }

  return new Response(
    JSON.stringify({
      data: transactions,
      page,
      totalBlocks: latestBlockNumber + 1,
      totalPages: Math.ceil((latestBlockNumber + 1) / limit),
    }),
    {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    }
  );
}
