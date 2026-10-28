import { cookies } from 'next/headers';
import AdminHeader from '@/components/admin/AdminHeader';
import AdminFooter from '@/components/admin/AdminFooter';
import AdminModals from '@/components/admin/AdminModals';
import { AUTH_USER_KEY } from '@/lib/auth-cookies';
import { User } from '@/types/restaurant';

/**
 * LAYOUT DA ÁREA PROTEGIDA ADMIN `src/app/(admin)/layout.tsx` (Server Component)
 * Demonstra a herança de layouts por pastas no Next.js App Router:
 * Todas as rotas dentro de `(admin)` (/atendimento, /mesas, /reservas, /produtos, /pedidos, /funcionarios)
 * herdam automaticamente o cabeçalho de gestão, os modais globais e o rodapé.
 * Também lê os cookies de sessão diretamente no servidor (SSR).
 */
export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = await cookies();
  const rawUser = cookieStore.get(AUTH_USER_KEY)?.value;
  let initialUser: User | null = null;

  if (rawUser) {
    try {
      initialUser = JSON.parse(decodeURIComponent(rawUser)) as User;
    } catch {
      initialUser = null;
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#09090b] text-zinc-100">
      <AdminHeader initialUser={initialUser} />
      <AdminModals />
      <main className="flex-1 w-full max-w-[1600px] mx-auto px-4 sm:px-6 py-5">
        {children}
      </main>
      <AdminFooter />
    </div>
  );
}

