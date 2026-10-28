'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { User } from '@/types/restaurant';
import { clearAuthSession, getClientUser } from '@/lib/auth-cookies';
import { getInitials } from '@/lib/format';

export type AdminModalType =
  | 'table'
  | 'product'
  | 'reservation'
  | 'staff'
  | null;

interface AdminHeaderProps {
  initialUser?: User | null;
}

/**
 * CLIENT COMPONENT (`'use client'`)
 * Barra superior do Sistema de Gestão fiel ao Print 1.
 * Dispara eventos para abertura dos modais (+ Nova mesa, + Novo produto, + Nova reserva, + Cadastrar funcionário)
 * e gerencia o encerramento seguro da sessão (Cookies + localStorage).
 */
export default function AdminHeader({ initialUser }: AdminHeaderProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<User | null>(initialUser ?? null);

  useEffect(() => {
    const clientUser = getClientUser();
    if (clientUser) {
      setUser(clientUser);
    } else if (!initialUser) {
      router.replace('/login');
    }
  }, [initialUser, router]);

  function triggerModal(type: Exclude<AdminModalType, null>) {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('open-admin-modal', { detail: { type } }),
      );
    }
  }

  async function handleLogout() {
    await clearAuthSession();
    router.push('/login');
    router.refresh();
  }

  const displayEmail = user?.email || 'admin@restaurant.com';
  const displayRole = user?.role || 'ADMIN';
  const initials = getInitials(user?.name || displayEmail);

  return (
    <header className="w-full border-b border-zinc-800/80 bg-[#0d0d10] sticky top-0 z-30">
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
        {/* Esquerda: Logo Restaurante Mesa */}
        <Link
          href="/atendimento"
          className="flex items-center gap-3 group shrink-0"
        >
          <div className="w-9 h-9 rounded-xl bg-zinc-100 text-zinc-950 flex items-center justify-center shadow-sm group-hover:bg-white transition-colors">
            <svg
              width="19"
              height="19"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2" />
              <path d="M7 2v20" />
              <path d="M21 15V2v0a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3Zm0 0v7" />
            </svg>
          </div>
          <div className="leading-tight">
            <p className="text-sm font-bold text-zinc-100">Restaurante Mesa</p>
            <p className="text-[11px] text-zinc-500">Sistema de gestão</p>
          </div>
        </Link>

        {/* Centro: Botões de Ação Rápida idênticos ao Print 1 */}
        <div className="hidden md:flex items-center gap-2 overflow-x-auto">
          <button
            type="button"
            onClick={() => triggerModal('table')}
            className="h-9 px-3.5 rounded-xl bg-[#151519] hover:bg-zinc-800 border border-zinc-800/90 text-xs font-medium text-zinc-200 flex items-center gap-1.5 transition-colors whitespace-nowrap"
          >
            <span className="text-zinc-400 text-sm leading-none">+</span>
            <span>Nova mesa</span>
          </button>

          <button
            type="button"
            onClick={() => triggerModal('product')}
            className="h-9 px-3.5 rounded-xl bg-[#151519] hover:bg-zinc-800 border border-zinc-800/90 text-xs font-medium text-zinc-200 flex items-center gap-1.5 transition-colors whitespace-nowrap"
          >
            <span className="text-zinc-400 text-sm leading-none">+</span>
            <span>Novo produto</span>
          </button>

          <button
            type="button"
            onClick={() => triggerModal('reservation')}
            className="h-9 px-3.5 rounded-xl bg-[#151519] hover:bg-zinc-800 border border-zinc-800/90 text-xs font-medium text-zinc-200 flex items-center gap-1.5 transition-colors whitespace-nowrap"
          >
            <span className="text-zinc-400 text-sm leading-none">+</span>
            <span>Nova reserva</span>
          </button>

          <button
            type="button"
            onClick={() => triggerModal('staff')}
            className="h-9 px-3.5 rounded-xl bg-[#151519] hover:bg-zinc-800 border border-zinc-800/90 text-xs font-medium text-zinc-200 flex items-center gap-1.5 transition-colors whitespace-nowrap"
          >
            <span className="text-zinc-400 text-sm leading-none">+</span>
            <span>Cadastrar funcionário</span>
          </button>

          <Link
            href="/cardapio"
            target="_blank"
            className="h-9 px-3.5 rounded-xl bg-emerald-950/40 hover:bg-emerald-900/50 border border-emerald-800/50 text-xs font-medium text-emerald-300 flex items-center gap-1.5 transition-colors whitespace-nowrap"
            title="Abrir a tela pública de Cardápio Digital para clientes"
          >
            <span>🍽️</span>
            <span>Cardápio Cliente</span>
          </Link>

          {pathname !== '/atendimento' && (
            <Link
              href="/atendimento"
              className="h-9 px-3.5 rounded-xl bg-zinc-100 text-zinc-950 text-xs font-semibold flex items-center gap-1.5"
            >
              <span>← Salão Principal</span>
            </Link>
          )}
        </div>

        {/* Direita: Perfil do Funcionário e Botão Sair */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="hidden sm:flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center text-xs font-bold text-zinc-200">
              {initials}
            </div>
            <div className="leading-tight">
              <p className="text-xs font-medium text-zinc-200">{displayEmail}</p>
              <span className="inline-block mt-0.5 px-1.5 py-0.2 rounded text-[10px] font-semibold bg-zinc-800 text-zinc-400 tracking-wide">
                {displayRole}
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={handleLogout}
            className="h-9 px-3.5 rounded-xl bg-[#151519] hover:bg-zinc-800 border border-zinc-800/90 text-xs font-medium text-zinc-200 flex items-center gap-1.5 transition-colors"
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
            <span>Sair</span>
          </button>
        </div>
      </div>
    </header>
  );
}

