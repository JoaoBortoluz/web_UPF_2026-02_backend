import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { AUTH_TOKEN_KEY, AUTH_USER_KEY } from '@/lib/auth-cookies';

/**
 * Route Handler do Next.js para gravação e leitura segura de Cookies no servidor.
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { token, user } = body;

    if (!token || !user) {
      return NextResponse.json(
        { message: 'Token e usuário são obrigatórios' },
        { status: 400 },
      );
    }

    const cookieStore = await cookies();
    const isProduction = process.env.NODE_ENV === 'production';

    cookieStore.set(AUTH_TOKEN_KEY, token, {
      httpOnly: false, // Permite leitura sincronizada entre SSR e Client/Middleware
      secure: isProduction,
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 8, // 8 horas
    });

    cookieStore.set(AUTH_USER_KEY, JSON.stringify(user), {
      httpOnly: false,
      secure: isProduction,
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 8,
    });

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json(
      { message: 'Erro ao salvar sessão em cookies' },
      { status: 500 },
    );
  }
}

export async function GET() {
  const cookieStore = await cookies();
  const token = cookieStore.get(AUTH_TOKEN_KEY)?.value ?? null;
  const rawUser = cookieStore.get(AUTH_USER_KEY)?.value ?? null;
  let user = null;

  if (rawUser) {
    try {
      user = JSON.parse(rawUser);
    } catch {
      user = null;
    }
  }

  return NextResponse.json({ token, user });
}

