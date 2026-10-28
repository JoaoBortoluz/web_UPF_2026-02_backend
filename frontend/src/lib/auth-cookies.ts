import { User } from '@/types/restaurant';

export const AUTH_TOKEN_KEY = 'restaurant_token';
export const AUTH_USER_KEY = 'restaurant_user';
export const CUSTOMER_CART_KEY = 'restaurant_customer_cart';
export const CUSTOMER_TABLE_KEY = 'restaurant_customer_table';

/**
 * Armazena a sessão de autenticação simultaneamente em:
 * 1. localStorage (acesso imediato em Client Components e sincronização entre abas)
 * 2. Cookies seguros (SameSite=Lax, Path=/, HttpOnly via Route Handler) para leitura em
 *    Server Components e proteção de rotas no Next.js Middleware.
 */
export async function saveAuthSession(token: string, user: User): Promise<void> {
  if (typeof window !== 'undefined') {
    // 1. Armazenamento no localStorage
    localStorage.setItem(AUTH_TOKEN_KEY, token);
    localStorage.setItem(AUTH_USER_KEY, JSON.stringify(user));

    // 2. Armazenamento em Cookie acessível para o Middleware imediatamente
    const maxAge = 60 * 60 * 8; // 8 horas (mesma validade do JWT no NestJS)
    const secureFlag = window.location.protocol === 'https:' ? '; Secure' : '';
    document.cookie = `${AUTH_TOKEN_KEY}=${encodeURIComponent(token)}; Path=/; Max-Age=${maxAge}; SameSite=Lax${secureFlag}`;
    document.cookie = `${AUTH_USER_KEY}=${encodeURIComponent(JSON.stringify(user))}; Path=/; Max-Age=${maxAge}; SameSite=Lax${secureFlag}`;

    // 3. Sincroniza também com Route Handler do servidor Next.js (cookies seguros HttpOnly/Server)
    try {
      await fetch('/api/auth/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, user }),
      });
    } catch {
      // Fallback caso executado em modo estático
    }
  }
}

/**
 * Remove a sessão tanto do localStorage quanto dos Cookies seguros
 */
export async function clearAuthSession(): Promise<void> {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(AUTH_TOKEN_KEY);
    localStorage.removeItem(AUTH_USER_KEY);

    document.cookie = `${AUTH_TOKEN_KEY}=; Path=/; Max-Age=0; SameSite=Lax`;
    document.cookie = `${AUTH_USER_KEY}=; Path=/; Max-Age=0; SameSite=Lax`;

    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch {
      // Ignora erro de rede no logout
    }
  }
}

/**
 * Obtém o token JWT no cliente (priorizando localStorage e fazendo fallback para Cookie)
 */
export function getClientToken(): string | null {
  if (typeof window === 'undefined') return null;

  const fromStorage = localStorage.getItem(AUTH_TOKEN_KEY);
  if (fromStorage) return fromStorage;

  const match = document.cookie
    .split('; ')
    .find((row) => row.startsWith(`${AUTH_TOKEN_KEY}=`));
  if (match) {
    return decodeURIComponent(match.split('=')[1]);
  }
  return null;
}

/**
 * Obtém os dados do usuário logado no cliente (localStorage ou Cookie)
 */
export function getClientUser(): User | null {
  if (typeof window === 'undefined') return null;

  try {
    const rawStorage = localStorage.getItem(AUTH_USER_KEY);
    if (rawStorage) {
      return JSON.parse(rawStorage) as User;
    }

    const match = document.cookie
      .split('; ')
      .find((row) => row.startsWith(`${AUTH_USER_KEY}=`));
    if (match) {
      return JSON.parse(decodeURIComponent(match.split('=')[1])) as User;
    }
  } catch {
    return null;
  }
  return null;
}

