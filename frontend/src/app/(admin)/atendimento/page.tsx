import PosDashboardClient from '@/components/admin/PosDashboardClient';

/**
 * ROTA PROTEGIDA `/atendimento` (Server Component)
 * Herda o layout administrativo de `src/app/(admin)/layout.tsx` e renderiza
 * o painel completo da Área de Atendimento conforme o Print 1.
 */
export default function AtendimentoPage() {
  return <PosDashboardClient />;
}

