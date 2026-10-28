import Link from 'next/link';

/**
 * LAYOUT DA ÁREA PÚBLICA `src/app/(public)/layout.tsx` (Server Component)
 * Demonstra a herança de layouts por pastas no App Router do Next.js.
 * Todas as rotas dentro de `(public)` (/login e /cardapio) herdam este layout.
 */
export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col bg-[#09090b] text-zinc-100">
      {/* Barra superior discreta da Área Pública permitindo alternar entre Cardápio do Cliente e Login da Equipe */}
      <header className="w-full border-b border-zinc-900/80 bg-[#09090b]/90 backdrop-blur-md sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-12 flex items-center justify-between text-xs text-zinc-400">
          <div className="flex items-center gap-2">
            <span className="inline-block w-2 h-2 rounded-full bg-emerald-400" />
            <span className="font-medium text-zinc-300">Restaurante Mesa</span>
            <span className="text-zinc-600">·</span>
            <span>Área Pública</span>
          </div>
          <nav className="flex items-center gap-2">
            <Link
              href="/cardapio"
              className="px-3 py-1 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-200 border border-zinc-800 transition-colors"
            >
              🍽️ Cardápio do Cliente
            </Link>
            <Link
              href="/login"
              className="px-3 py-1 rounded-lg hover:bg-zinc-900 text-zinc-400 hover:text-zinc-200 transition-colors"
            >
              🔒 Acesso Gestão
            </Link>
          </nav>
        </div>
      </header>

      <main className="flex-1 flex flex-col">{children}</main>
    </div>
  );
}

