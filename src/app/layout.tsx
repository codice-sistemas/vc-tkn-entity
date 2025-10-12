import '../styles/globals.css'
import { Providers } from '@/contexts/providers';

export const metadata = {
  title: 'Entidade Centralizadora',
  description: 'Centralized Entity',
  icons: {
    icon: '/favicon.ico',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body className="bg-gray-50 min-h-screen text-gray-900">
            <Providers>
              {children}
            </Providers>            
    </body>
    </html>
  );
}