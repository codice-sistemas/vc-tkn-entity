'use client';
import { AppLayout } from '@/components/layout/app-layout';
import { 
  BuildingOffice2Icon, 
  UserIcon,
  ShieldCheckIcon,
} from '@heroicons/react/24/outline';


import Link from 'next/link';

export default function Home() {
  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900">Frontend Entidade Centralizadora</h1>
          <p className="mt-2 text-lg text-gray-600">Rede Sistema Nacional Blockchain</p>
        </div>

      </div>

      <div className="p-6">

        {/* Backend Features */}
        <div className="max-w-4xl mx-auto">
          <div className="bg-white shadow rounded-lg">
            <div className="bg-gray-50 text-center px-6 py-4 border-b border-gray-200">
              <h1 className="text-xl mx-center font-bold text-gray-800">Recursos</h1>
            </div>
            
            <div className="p-6">

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">

                <Link href="/gui/ifs" 
                className="bg-blue-600 hover:bg-blue-700 p-4 rounded-lg text-white block hover:shadow-lg transition-all duration-200">
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <BuildingOffice2Icon className="h-8 w-8 mx-auto mb-2 text-blue-600" />
                    <div className="font-medium text-sm text-gray-900">Base de Instituições</div>
                    <div className="text-xs text-gray-600 mt-1">Lista / Verifica Instituições Participantes</div>
                  </div>
                </Link>     

                <Link href="/gui/clients" 
                className="bg-green-600 hover:bg-green-700 p-4 rounded-lg text-white block hover:shadow-lg transition-all duration-200">
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <UserIcon className="h-8 w-8 mx-auto mb-2 text-green-600" />
                    <div className="font-medium text-sm text-gray-900">Base de Clientes</div>
                    <div className="text-xs text-gray-600 mt-1">Lista / Verifica Clientes</div>
                  </div>
                </Link>                

                <Link href="/api/transactions"
                className="bg-purple-600 hover:bg-purple-700 p-4 rounded-lg text-white block hover:shadow-lg transition-all duration-200">
                  <div className="text-center p-4 bg-purple-50 rounded-lg">
                    <ShieldCheckIcon className="h-8 w-8 mx-auto mb-2 text-purple-600" />
                    <div className="font-medium text-sm text-gray-900">Base Rede Blockchain</div>
                    <div className="text-xs text-gray-600 mt-1">Exibe Transações registradas nos blocos</div>
                  </div>
                </Link>

              </div>
            </div>
          </div>
        </div>
      </div>
    
    </AppLayout>
  );
}