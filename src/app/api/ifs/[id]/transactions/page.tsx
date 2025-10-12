'use client';
import { useEffect, useState } from 'react';

export default function TransactionsPage() {
  const [txs, setTxs] = useState<any[]>([]);

  useEffect(() => { fetchTxs(); }, []);

  async function fetchTxs() {
    const res = await fetch('/api/transactions');
    const data = await res.json();
    setTxs(data.data || []);
  }

  return (
    <div>
      <h2>Transações</h2>
      <ul>
        {txs.map(t => (
          <li key={t.id}>{t.txHash} — {t.status} — {t.blockNumber}</li>
        ))}
      </ul>
    </div>
  );
}