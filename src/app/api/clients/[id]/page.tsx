'use client';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';

export default function ClientDetailPage() {
  const params = useParams();
  const id = params?.id as string;
  const [client, setClient] = useState<any>(null);
  const [txs, setTxs] = useState<any[]>([]);

  useEffect(() => { if (id) fetchClient(); }, [id]);

  async function fetchClient() {
    const res = await fetch(`/api/clients`);
    const data = await res.json();
    const found = data.data.find((x:any) => String(x.id) === String(id));
    setClient(found);

    const r2 = await fetch(`/api/clients/${id}/transactions`);
    const d2 = await r2.json();
    setTxs(d2.data || []);
  }

  if (!client) return <div>Carregando...</div>;

  return (
    <div>
      <h2>{client.name}</h2>
      <p>Email: {client.email}</p>
      <p>AA: {client.aaHash}</p>

      <h3>Transações</h3>
      <ul>
        {txs.map(t => (
          <li key={t.id}>{t.txHash} — {t.status} — {t.blockNumber}</li>
        ))}
      </ul>
    </div>
  );
}