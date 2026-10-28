'use client';

import React, { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { loginApi, registerStaffApi } from '@/lib/api';
import { saveAuthSession } from '@/lib/auth-cookies';
import { Role } from '@/types/restaurant';

/**
 * CLIENT COMPONENT (`'use client'`)
 * Formulário interativo de Login e Cadastro fiel ao Print 2.
 * Realiza autenticação na API NestJS e persiste o token JWT tanto em
 * localStorage quanto em Cookies seguros para proteção de rotas via Middleware.
 */
export default function LoginFormClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get('redirect') || '/atendimento';

  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<Role>('WAITER');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showHelper, setShowHelper] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (mode === 'register') {
        await registerStaffApi({ name, email, password, role });
      }

      const authResponse = await loginApi(email, password);
      await saveAuthSession(authResponse.access_token, authResponse.user);

      router.push(redirectTo);
      router.refresh();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Não foi possível autenticar. Verifique suas credenciais.',
      );
    } finally {
      setLoading(false);
    }
  }

  function fillCredentials(targetEmail: string, targetPass: string) {
    setMode('login');
    setEmail(targetEmail);
    setPassword(targetPass);
    setError(null);
  }

  return (
    <div className="flex-1 flex items-center justify-center px-4 py-12 bg-[#09090b]">
      <div className="w-full max-w-[400px] bg-[#121215] border border-zinc-800/80 rounded-2xl p-8 shadow-2xl">
        {/* Ícone Garfo e Faca em quadrado branco arredondado idêntico ao Print */}
        <div className="flex justify-center mb-5">
          <div className="w-12 h-12 rounded-xl bg-zinc-100 text-zinc-950 flex items-center justify-center shadow-sm">
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2" />
              <path d="M7 2v20" />
              <path d="M21 15V2v0a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3Zm0 0v7" />
            </svg>
          </div>
        </div>

        {/* Título e Subtítulo */}
        <div className="text-center mb-7">
          <h1 className="text-2xl font-bold text-zinc-100 tracking-tight">
            {mode === 'login' ? 'Bem-vindo' : 'Criar conta'}
          </h1>
          <p className="text-sm text-zinc-400 mt-1.5">
            {mode === 'login'
              ? 'Acesse o sistema de gestão do seu restaurante'
              : 'Cadastre um novo membro da equipe no sistema'}
          </p>
        </div>

        {error && (
          <div
            role="alert"
            className="mb-5 rounded-xl bg-red-950/50 border border-red-800/60 px-3.5 py-2.5 text-xs text-red-300"
          >
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === 'register' && (
            <div>
              <label
                htmlFor="name"
                className="block text-xs font-medium text-zinc-300 mb-1.5"
              >
                Nome completo
              </label>
              <input
                id="name"
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex: Maria Recepcionista"
                className="w-full h-11 px-3.5 rounded-xl bg-[#18181c] border border-zinc-800 text-sm text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:border-zinc-500 transition-colors"
              />
            </div>
          )}

          <div>
            <label
              htmlFor="email"
              className="block text-xs font-medium text-zinc-300 mb-1.5"
            >
              E-mail
            </label>
            <input
              id="email"
              type="email"
              required
              autoComplete="username"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="seu@email.com"
              className="w-full h-11 px-3.5 rounded-xl bg-[#18181c] border border-zinc-800 text-sm text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:border-zinc-500 transition-colors"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label
                htmlFor="password"
                className="block text-xs font-medium text-zinc-300"
              >
                Senha
              </label>
              {mode === 'login' && (
                <button
                  type="button"
                  onClick={() => setShowHelper((prev) => !prev)}
                  className="text-xs text-zinc-400 hover:text-zinc-200 transition-colors"
                >
                  Esqueceu a senha?
                </button>
              )}
            </div>
            <input
              id="password"
              type="password"
              required
              minLength={6}
              autoComplete={
                mode === 'login' ? 'current-password' : 'new-password'
              }
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full h-11 px-3.5 rounded-xl bg-[#18181c] border border-zinc-800 text-sm text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:border-zinc-500 transition-colors"
            />
          </div>

          {mode === 'register' && (
            <div>
              <label
                htmlFor="role"
                className="block text-xs font-medium text-zinc-300 mb-1.5"
              >
                Cargo na equipe
              </label>
              <select
                id="role"
                value={role}
                onChange={(e) => setRole(e.target.value as Role)}
                className="w-full h-11 px-3.5 rounded-xl bg-[#18181c] border border-zinc-800 text-sm text-zinc-100 focus:outline-none focus:border-zinc-500 transition-colors"
              >
                <option value="ADMIN">ADMIN (Administrador)</option>
                <option value="MANAGER">MANAGER (Gerente)</option>
                <option value="WAITER">WAITER (Garçom)</option>
                <option value="RECEPTIONIST">
                  RECEPTIONIST (Recepcionista)
                </option>
              </select>
            </div>
          )}

          {showHelper && mode === 'login' && (
            <div className="rounded-xl bg-zinc-900/90 border border-zinc-800 p-3 text-xs text-zinc-300 space-y-2">
              <p className="font-medium text-zinc-200">
                Credenciais padrão do Seed:
              </p>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() =>
                    fillCredentials('admin@restaurant.com', 'admin123')
                  }
                  className="px-2.5 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-100 transition-colors"
                >
                  Usar Admin (admin@restaurant.com)
                </button>
                <button
                  type="button"
                  onClick={() =>
                    fillCredentials('waiter@restaurant.com', 'admin123')
                  }
                  className="px-2.5 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-100 transition-colors"
                >
                  Usar Garçom (waiter@restaurant.com)
                </button>
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full h-11 mt-2 rounded-xl bg-zinc-100 hover:bg-white disabled:opacity-60 text-zinc-950 font-semibold text-sm transition-colors shadow-sm"
          >
            {loading
              ? 'Autenticando...'
              : mode === 'login'
                ? 'Entrar'
                : 'Cadastrar e Entrar'}
          </button>
        </form>

        <div className="mt-5 text-center text-xs text-zinc-400">
          {mode === 'login' ? (
            <>
              Não tem uma conta?{' '}
              <button
                type="button"
                onClick={() => {
                  setMode('register');
                  setError(null);
                }}
                className="font-semibold text-zinc-200 hover:text-white transition-colors"
              >
                Cadastre-se
              </button>
            </>
          ) : (
            <>
              Já possui uma conta?{' '}
              <button
                type="button"
                onClick={() => {
                  setMode('login');
                  setError(null);
                }}
                className="font-semibold text-zinc-200 hover:text-white transition-colors"
              >
                Fazer login
              </button>
            </>
          )}
        </div>

        {/* Atalho rápido para o Cardápio do Cliente */}
        <div className="mt-6 pt-5 border-t border-zinc-800/80 flex items-center justify-between text-xs text-zinc-500">
          <span>É cliente na mesa?</span>
          <Link
            href="/cardapio"
            className="text-zinc-300 hover:text-white font-medium underline underline-offset-4"
          >
            Abrir Cardápio Digital →
          </Link>
        </div>
      </div>
    </div>
  );
}

