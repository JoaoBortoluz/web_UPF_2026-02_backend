import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { AUTH_TOKEN_KEY } from '@/lib/auth-cookies';

/**
 * ROTA RAIZ `/` (Server Component)
 * Verifica no servidor (via Cookies) se o funcionário está autenticado:
 * - Se autenticado -> redireciona para `/atendimento` (Área de Gestão Protegida)
 * - Se não autenticado -> redireciona para `/login` (Área Pública)
 */
export default async function HomePage() {
  const cookieStore = await cookies();
  const token = cookieStore.get(AUTH_TOKEN_KEY)?.value;

  if (token) {
    redirect('/atendimento');
  }

  redirect('/login');
}

