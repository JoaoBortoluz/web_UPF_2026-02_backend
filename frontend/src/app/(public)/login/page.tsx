import { Suspense } from 'react';
import LoginFormClient from '@/components/public/LoginFormClient';

/**
 * PÁGINA DE LOGIN `/login` (Server Component)
 * Renderiza o Client Component de autenticação dentro de uma fronteira Suspense.
 */
export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="flex-1 flex items-center justify-center text-sm text-zinc-500">
          Carregando tela de acesso...
        </div>
      }
    >
      <LoginFormClient />
    </Suspense>
  );
}

