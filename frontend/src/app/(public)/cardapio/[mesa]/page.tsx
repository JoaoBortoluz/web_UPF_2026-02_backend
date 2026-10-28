import CustomerMenuClient from '@/components/public/CustomerMenuClient';

/**
 * ROTA DINÂMICA POR PASTA `/cardapio/[mesa]` (Server Component)
 * Exemplo: `/cardapio/4` já abre o cardápio pré-selecionado na Mesa 04 (ideal para QR Code de mesa).
 */
export default async function CardapioPorMesaPage({
  params,
}: {
  params: Promise<{ mesa: string }>;
}) {
  const { mesa } = await params;
  const tableNumber = Number(mesa) || 4;

  return <CustomerMenuClient initialTableNumber={tableNumber} />;
}

