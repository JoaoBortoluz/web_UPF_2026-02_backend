import { NextRequest, NextResponse } from 'next/server';

/**
 * Middleware do Next.js para controle de Área Pública vs Proteção de Rotas Admin.
 * Executa na borda (Edge) antes de renderizar as páginas, verificando o cookie seguro `restaurant_token`.
 */

const ADMIN_PROTECTED_PATHS = [
  '/atendimento',
  '/mesas',
  '/reservas',
  '/produtos',
  '/pedidos',
  '/funcionarios',
];

const PUBLIC_PATHS = ['/login', '/cardapio'];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get('restaurant_token')?.value;

  const isProtectedAdminRoute = ADMIN_PROTECTED_PATHS.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`),
  );

  // 1. Bloqueia acesso não autenticado às rotas administrativas e redireciona para /login
  if (isProtectedAdminRoute && !token) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // 2. Se o funcionário já possui cookie válido e acessa /login, redireciona para /atendimento
  if (pathname === '/login' && token) {
    return NextResponse.redirect(new URL('/atendimento', request.url));
  }

  // 3. Rotas públicas (/cardapio e /cardapio/[mesa]) permanecem abertas para os clientes
  const isPublicRoute = PUBLIC_PATHS.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`),
  );
  if (isPublicRoute) {
    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/atendimento/:path*',
    '/mesas/:path*',
    '/reservas/:path*',
    '/produtos/:path*',
    '/pedidos/:path*',
    '/funcionarios/:path*',
    '/login',
    '/cardapio/:path*',
  ],
};

