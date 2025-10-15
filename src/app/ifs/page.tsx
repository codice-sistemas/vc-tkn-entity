'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { AppLayout } from '@/components/layout/app-layout';
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline';

interface Client {
  id: number;
  name: string;
  doc: string;
  birthDate: string;
  ifHash: string;
  auth_sub: string;
}

export default function IFsPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [q, setQ] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchClients();
  }, []);

  async function fetchClients() {
    setLoading(true);
    try {
      const res = await fetch('/api/ifs');
      const data = await res.json();
      setClients(data.data || []);
    } catch (err) {
      console.error('Failed to load clients:', err);
    } finally {
      setLoading(false);
    }
  }

  const filtered = clients.filter(c =>
    c.name?.toLowerCase().includes(q.toLowerCase()) ||
    c.doc?.toLowerCase().includes(q.toLowerCase()) ||
    c.ifHash?.toLowerCase().includes(q.toLowerCase())
  );

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Sticky voltar button */}
        <Link href="/">
          <button className="fixed bottom-6 left-6 bg-red-600 text-white px-5 py-2.5 rounded-lg shadow-lg hover:bg-red-700 transition">
            ← Voltar
          </button>
        </Link>
        {/* Header */}
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900">Base de Instituições Participantes</h1>
          <p className="mt-2 text-lg text-gray-600">Consulta de Instituições Autorizadas vinculadas à rede</p>
        </div>

        {/* Search Bar */}
        <div className="max-w-3xl mx-auto flex items-center gap-2">
          <div className="flex w-full rounded-lg shadow-sm ring-1 ring-gray-300 focus-within:ring-2 focus-within:ring-blue-500 bg-white px-3 py-2">
            <MagnifyingGlassIcon className="h-5 w-5 text-gray-400 mr-2 mt-0.5" />
            <input
              type="text"
              className="w-full border-none outline-none text-gray-800 placeholder-gray-400"
              placeholder="Pesquisar por nome, documento ou hashAA..."
              value={q}
              onChange={e => setQ(e.target.value)}
            />
          </div>
          <button
            onClick={fetchClients}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg shadow"
          >
            Buscar
          </button>
        </div>

        {/* Table */}
        <div className="max-w-6xl mx-auto bg-white shadow rounded-lg overflow-hidden">
          <div className="bg-blue-50 text-center px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-800">Instituições</h2>
          </div>

          {loading ? (
            <div className="text-center py-6 text-gray-500">Carregando...</div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-6 text-gray-500">Nenhuma instituição encontrada.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nome</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Documento</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Abertura</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Hash AA</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Autorizações</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-100">
                  {filtered.map((c) => (
                    <tr key={c.id} className="hover:bg-gray-50 transition">
                      <td className="px-6 py-4 text-sm text-gray-700">{c.id}</td>
                      <td className="px-6 py-4 text-sm text-blue-600 font-medium">
                        <Link href={`/ifs/${c.id}`} className="hover:underline">
                          {c.name}
                        </Link>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-700">{c.doc}</td>
                      <td className="px-6 py-4 text-sm text-gray-700">{c.birthDate}</td>
                      <td className="px-6 py-4 text-sm text-gray-700 truncate max-w-[150px]">{c.ifHash || '-'}</td>
                      <td className="px-6 py-4 text-sm text-gray-700 truncate max-w-[150px]">{c.auth_sub || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
