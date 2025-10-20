'use client';
import { useEffect, useState } from 'react';

export default function TransactionsPage() {
  const [txs, setTxs] = useState<any[]>([]);

  useEffect(() => {
    const fetchTxs = async () => {
      const res = await fetch('/api/transactions');
      const data = await res.json();
      setTxs(data.data || []);
    };

    fetchTxs(); // fetch inicial
    const interval = setInterval(fetchTxs, 5000); // atualiza a cada 5s

    return () => clearInterval(interval); // limpa quando componente desmonta
  }, []);

  return (
    <div>
      <h2>Transações</h2>
      <ul>
        {txs.map(t => (
          <li key={t.id}>
            {t.txHash} — {t.status} — {t.blockNumber}
          </li>
        ))}
      </ul>
    </div>
  );
}