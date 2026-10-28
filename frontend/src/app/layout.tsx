import type { Metadata } from 'next';
import './globals.css';

/**
 * ROOT LAYOUT (Server Component)
 * Layout raiz herdado por todas as pastas e grupos de rotas:
 * - (public): /login e /cardapio
 * - (admin): /atendimento, /mesas, /reservas, /produtos, /pedidos, /funcionarios
 */
export const metadata: Metadata = {
  title: 'Restaurante Mesa — Sistema de Gestão & Cardápio Digital',
  description:
    'Sistema integrado de gestão de salão, mesas, reservas, comandas e cardápio digital para autoatendimento de clientes.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" className="dark">
      <body className="min-h-screen bg-[#09090b] text-zinc-100 antialiased selection:bg-white selection:text-zinc-950">
        {children}
      </body>
    </html>
  );
}

