import Link from 'next/link';

/**
 * SERVER COMPONENT
 * Rodapé do Sistema de Gestão fiel ao Print 1, com links para todas as pastas de rotas
 * dentro do grupo `(admin)`.
 */
export default function AdminFooter() {
  return (
    <footer className="w-full border-t border-zinc-900 bg-[#09090b] mt-auto">
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 py-3 flex flex-col sm:flex-row items-center justify-between gap-2 text-[11px] text-zinc-500">
        <div className="flex flex-wrap items-center gap-1.5">
          <Link
            href="/atendimento"
            className="text-zinc-400 hover:text-zinc-200 transition-colors"
          >
            Área conectada
          </Link>
          <span>·</span>
          <Link
            href="/mesas"
            className="hover:text-zinc-300 transition-colors"
          >
            Mesas
          </Link>
          <span>/</span>
          <Link
            href="/reservas"
            className="hover:text-zinc-300 transition-colors"
          >
            Reservas
          </Link>
          <span>/</span>
          <Link
            href="/produtos"
            className="hover:text-zinc-300 transition-colors"
          >
            Produtos
          </Link>
          <span>/</span>
          <Link
            href="/pedidos"
            className="hover:text-zinc-300 transition-colors"
          >
            Pedidos
          </Link>
          <span>/</span>
          <Link
            href="/funcionarios"
            className="hover:text-zinc-300 transition-colors"
          >
            Funcionários
          </Link>
          <span>·</span>
          <Link
            href="/cardapio"
            className="text-emerald-400/90 hover:text-emerald-300 transition-colors"
          >
            Cardápio do Cliente
          </Link>
        </div>

        <div className="text-zinc-500">
          Todos os preços em BRL · America/São_Paulo
        </div>
      </div>
    </footer>
  );
}

