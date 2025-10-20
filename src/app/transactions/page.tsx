'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { AppLayout } from '@/components/layout/app-layout';
import { Loader2 } from 'lucide-react';

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    async function loadTransactions() {
      try {
        setLoading(true);
        const res = await fetch(`/api/transactions?page=${page}`);
        if (!res.ok) throw new Error('Erro ao carregar transações');
        const data = await res.json();
        setTransactions(data.data || []);
        setTotalPages(data.totalPages || 1);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    loadTransactions();
  }, [page]);

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Botão voltar fixo */}
        <Link href="/">
          <button className="fixed bottom-6 left-6 bg-red-600 text-white px-5 py-2.5 rounded-lg shadow-lg hover:bg-red-700 transition">
            ← Voltar
          </button>
        </Link>
        {/* Título principal */}
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Rede Blockchain</h1>
        </div>

        {/* Subtabela "Transações" */}
        <div className="bg-white rounded-lg">
          <div className="bg-purple-50 border text-center px-6 py-3 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-800">Transações</h2>
          </div>

          {/* Tabela de dados grudada na subtabela */}
          <div className="overflow-x-auto">
            <table className="min-w-full border-collapse text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="p-2 text-left border-b">Hash</th>
                  <th className="p-2 text-left border-b">From</th>
                  <th className="p-2 text-left border-b">To</th>
                  <th className="p-2 text-left border-b">Timestamp</th>
                  <th className="p-2 text-left border-b">Metadata</th>
                </tr>
              </thead>

              <tbody>
                {loading || error || transactions.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-4 text-center text-gray-500 font-mono">
                      {loading ? (
                        <div className="flex items-center justify-center gap-2">
                          <Loader2 className="animate-spin" /> Carregando...
                        </div>
                      ) : error ? (
                        <span className="text-red-500">{error}</span>
                      ) : (
                        'Nenhuma transação encontrada.'
                      )}
                    </td>
                  </tr>
                ) : (
                  transactions.map((tx, i) => (
                    <tr key={i} className="hover:bg-gray-50">
                      <td className="p-2 border-b font-mono text-xs">
                        {tx.hash.slice(0, 6) + '...' + tx.hash.slice(-4)}
                      </td>
                      <td className="p-2 border-b font-mono text-xs">
                        {tx.from.slice(0, 6) + '...' + tx.from.slice(-4)}
                      </td>
                      <td className="p-2 border-b font-mono text-xs">
                        {tx.to ? tx.to.slice(0, 6) + '...' + tx.to.slice(-4) : '-'}
                      </td>
                      <td className="p-2 border-b font-mono text-xs">
                        {tx.timestamp ? tx.timestamp : '—'}
                      </td>
                      <td className="p-2 border-b font-mono text-xs">
                        {tx.metadata ? (
                          <pre className="text-xs bg-gray-50 p-1 rounded">
                            {JSON.stringify(tx.metadata, null, 2)}
                          </pre>
                        ) : (
                          <span className="text-gray-400">Sem metadados</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          <div className="flex justify-center mt-4 gap-4 mb-3">
            <button
              onClick={() => setPage(p => Math.max(p - 1, 1))}
              disabled={page <= 1}
              className="px-3 py-1 bg-blue-200 rounded disabled:opacity-50"
            >
              ← Anterior
            </button>
            <button
              onClick={() => setPage(p => Math.min(p + 1, totalPages))}
              disabled={page >= totalPages}
              className="px-3 py-1 bg-green-200 rounded disabled:opacity-50"
            >
              Próxima →
            </button>
          </div>
          {/* Spacer */}
          <div className="h-1" />        
        </div>
      </div>
    </AppLayout>
  );
}
