'use client';

import { ReactNode } from 'react';
import '@/styles/page-layout.css';

interface PageContentProps {
  title: string;
  subtitle?: string;
  children?: ReactNode;
}

export function PageContent({ title, subtitle, children }: PageContentProps) {
  return (
    <div className="page-container">
      {/* Cabeçalho da página */}
      <div className="page-header">
        <h1>{title}</h1>
        {subtitle && <p>{subtitle}</p>}
      </div>

      {/* Conteúdo */}
      <div className="page-section">
        {children}
      </div>
    </div>
  );
}
