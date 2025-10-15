'use client';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { AppLayout } from '@/components/layout/app-layout';

export default function ClientDetailsPage() {
  const { id } = useParams();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) fetchClient();
  }, [id]);

  async function fetchClient() {
    setLoading(true);
    try {
      const res = await fetch(`/api/ifs/${id}`);
      const json = await res.json();
      setData(json);
    } catch (err) {
      console.error('Erro ao carregar Participante:', err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <AppLayout>
      <div className="relative max-w-6xl mx-auto p-6">
        {/* Fixed voltar button */}
        <Link href="/ifs">
          <button className="fixed bottom-6 left-6 bg-red-600 text-white px-5 py-2.5 rounded-lg shadow-lg hover:bg-red-700 transition">
            ← Voltar
          </button>
        </Link>

        {loading ? (
          <div className="text-center text-gray-500 py-10">Carregando...</div>
        ) : !data || !data.user ? (
          <div className="text-center text-gray-500 py-10">
            Participante não encontrado.
          </div>
        ) : (
          <>
            <div className="bg-white shadow rounded-lg overflow-hidden border border-gray-200">
              <div className="bg-blue-50 text-center px-6 py-4 border-b border-gray-200">
                <h2 className="text-xl font-semibold text-gray-800">
                  {data.user.name}
                </h2>
              </div>

              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <tbody className="bg-white divide-y divide-gray-100">
                    <tr>
                      <td className="px-6 py-4 text-sm font-semibold text-gray-600 w-1/3">
                        ID
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-800">
                        {data.user.id}
                      </td>
                    </tr>
                    <tr>
                      <td className="px-6 py-4 text-sm font-semibold text-gray-600">
                        Documento
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-800">
                        {data.user.doc}
                      </td>
                    </tr>
                    <tr>
                      <td className="px-6 py-4 text-sm font-semibold text-gray-600">
                        Abertura
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-800">
                        {data.user.birthDate}
                      </td>
                    </tr>
                    <tr>
                      <td className="px-6 py-4 text-sm font-semibold text-gray-600">
                        Hash AA
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-800 truncate max-w-[300px]">
                        {data.user.ifHash || '-'}
                      </td>
                    </tr>
                    <tr>
                      <td className="px-6 py-4 text-sm font-semibold text-gray-600">
                        Autorizações
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-800">
                        {data.user.auth_sub || '-'}
                      </td>
                    </tr>

                    {/* Subtable row (spans both columns) */}
                    <tr>
                      <td
                        colSpan={2}
                        className="px-6 py-6 bg-gray-50 text-sm text-gray-800"
                      >
                        <div className="font-semibold text-gray-700 mb-2">
                          Tokens na Blockchain
                        </div>

                        {data.tokens?.length ? (
                          <div className="overflow-x-auto border border-gray-200 rounded-lg bg-white">
                            <table className="min-w-full divide-y divide-gray-200 text-sm">
                              <thead className="bg-gray-100">
                                <tr>
                                  <th className="px-4 py-2 text-left font-medium text-gray-600">
                                    Nome
                                  </th>
                                  <th className="px-4 py-2 text-left font-medium text-gray-600">
                                    Token ID
                                  </th>
                                  <th className="px-4 py-2 text-left font-medium text-gray-600">
                                    Estado
                                  </th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-gray-100">
                                {data.tokens.map((t: any, i: number) => (
                                  <tr key={i} className="hover:bg-gray-50">
                                    <td className="px-4 py-2">{t.name}</td>
                                    <td className="px-4 py-2">{t.tokenId}</td>
                                    <td className="px-4 py-2">{t.balance}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        ) : (
                          <p className="text-gray-500">Nenhum token encontrado.</p>
                        )}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>
    </AppLayout>
  );
}
