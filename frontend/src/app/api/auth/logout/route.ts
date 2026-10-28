import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { AUTH_TOKEN_KEY, AUTH_USER_KEY } from '@/lib/auth-cookies';

/**
 * Route Handler do Next.js para encerrar a sessão e remover os cookies de autenticação.
 */
export async function POST() {
  const cookieStore = await cookies();
  cookieStore.delete(AUTH_TOKEN_KEY);
  cookieStore.delete(AUTH_USER_KEY);
  return NextResponse.json({ ok: true });
}

