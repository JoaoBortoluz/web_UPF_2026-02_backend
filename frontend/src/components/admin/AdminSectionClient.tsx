'use client';

import React, { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import {
  closeOrderApi,
  deleteProductApi,
  fetchDashboardData,
  INITIAL_DEMO_STATE,
  subscribeRealtimeSync,
} from '@/lib/api';
import {
  formatCurrency,
  formatOrderDisplayNumber,
  formatShortDate,
  formatTableNumber,
  formatTimeHHMM,
} from '@/lib/format';
import {
  Order,
  Product,
  Reservation,
  Table,
  User,
} from '@/types/restaurant';

interface AdminSectionClientProps {
  section: 'mesas' | 'reservas' | 'produtos' | 'pedidos' | 'funcionarios';
}

/**
 * CLIENT COMPONENT (`'use client'`)
 * Visões dedicadas para as rotas por pasta do grupo `(admin)`:
 * `/mesas`, `/reservas`, `/produtos`, `/pedidos` e `/funcionarios`.
 */
export default function AdminSectionClient({
  section,
}: AdminSectionClientProps) {
  const [tables, setTables] = useState<Table[]>(INITIAL_DEMO_STATE.tables);
  const [products, setProducts] = useState<Product[]>(
    INITIAL_DEMO_STATE.products,
  );
  const [reservations, setReservations] = useState<Reservation[]>(
    INITIAL_DEMO_STATE.reservations,
  );
  const [orders, setOrders] = useState<Order[]>(INITIAL_DEMO_STATE.orders);
  const [staff, setStaff] = useState<User[]>(INITIAL_DEMO_STATE.staff);

  const loadData = useCallback(async () => {
    const { snapshot } = await fetchDashboardData();
    if (snapshot.tables.length > 0 || snapshot.products.length > 0) {
      setTables(snapshot.tables);
      setProducts(snapshot.products);
      setReservations(snapshot.reservations);
      setOrders(snapshot.orders);
      setStaff(snapshot.staff);
    }
  }, []);

  useEffect(() => {
    loadData();
    const unsub = subscribeRealtimeSync(() => loadData());
    const onMutated = () => loadData();
    window.addEventListener('admin-data-mutated', onMutated);
    return () => {
      unsub();
      window.removeEventListener('admin-data-mutated', onMutated);
    };
  }, [loadData]);

  function openHeaderModal(type: 'table' | 'product' | 'reservation' | 'staff') {
    window.dispatchEvent(
      new CustomEvent('open-admin-modal', { detail: { type } }),
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-zinc-800/80 pb-4">
        <div>
          <h1 className="text-2xl font-bold text-zinc-100">
            {section === 'mesas' && 'Gestão de Mesas do Salão'}
            {section === 'reservas' && 'Controle de Reservas'}
            {section === 'produtos' && 'Catálogo de Produtos do Cardápio'}
            {section === 'pedidos' && 'Histórico e Comandas Abertas'}
            {section === 'funcionarios' && 'Equipe e Funcionários'}
          </h1>
          <p className="text-xs text-zinc-500 mt-1">
            Rota protegida do grupo <code className="text-zinc-300">(admin)/{section}</code> com herança de layout.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {section === 'mesas' && (
            <button
              type="button"
              onClick={() => openHeaderModal('table')}
              className="h-9 px-4 rounded-xl bg-zinc-100 text-zinc-950 text-xs font-semibold"
            >
              + Nova mesa
            </button>
          )}
          {section === 'produtos' && (
            <button
              type="button"
              onClick={() => openHeaderModal('product')}
              className="h-9 px-4 rounded-xl bg-zinc-100 text-zinc-950 text-xs font-semibold"
            >
              + Novo produto
            </button>
          )}
          {section === 'reservas' && (
            <button
              type="button"
              onClick={() => openHeaderModal('reservation')}
              className="h-9 px-4 rounded-xl bg-zinc-100 text-zinc-950 text-xs font-semibold"
            >
              + Nova reserva
            </button>
          )}
          {section === 'funcionarios' && (
            <button
              type="button"
              onClick={() => openHeaderModal('staff')}
              className="h-9 px-4 rounded-xl bg-zinc-100 text-zinc-950 text-xs font-semibold"
            >
              + Cadastrar funcionário
            </button>
          )}
        </div>
      </div>

      {section === 'mesas' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {tables.map((t) => (
            <div
              key={t.id}
              className="bg-[#121215] border border-zinc-800 rounded-2xl p-5 flex flex-col justify-between gap-4"
            >
              <div className="flex items-center justify-between">
                <span className="text-lg font-bold text-zinc-100">
                  Mesa {formatTableNumber(t.number)}
                </span>
                <span className="text-xs text-zinc-400">
                  {t.capacity} lugares
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span
                  className={`px-2.5 py-0.5 rounded text-xs font-bold ${
                    t.status === 'AVAILABLE'
                      ? 'bg-emerald-950/80 text-emerald-400'
                      : t.status === 'OCCUPIED'
                        ? 'bg-amber-950/80 text-amber-400'
                        : 'bg-indigo-950/80 text-indigo-400'
                  }`}
                >
                  {t.status === 'AVAILABLE'
                    ? 'DISPONÍVEL'
                    : t.status === 'OCCUPIED'
                      ? 'OCUPADA'
                      : 'RESERVADA'}
                </span>
                <Link
                  href={`/cardapio/${t.number}`}
                  className="text-xs text-zinc-300 hover:text-white underline"
                >
                  Link QR Cardápio →
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}

      {section === 'produtos' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {products.map((p) => (
            <div
              key={p.id}
              className="bg-[#121215] border border-zinc-800 rounded-2xl p-5 flex flex-col justify-between gap-3"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] bg-zinc-800 text-zinc-300">
                    {p.category}
                  </span>
                  <button
                    type="button"
                    onClick={async () => {
                      await deleteProductApi(p.id);
                      loadData();
                    }}
                    className="text-xs text-zinc-500 hover:text-red-400"
                  >
                    Excluir 🗑
                  </button>
                </div>
                <h3 className="text-base font-bold text-zinc-100">{p.name}</h3>
                {p.description && (
                  <p className="text-xs text-zinc-400 mt-1">{p.description}</p>
                )}
              </div>
              <p className="text-lg font-bold text-zinc-100">
                {formatCurrency(p.price)}
              </p>
            </div>
          ))}
        </div>
      )}

      {section === 'reservas' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {reservations.map((r) => (
            <div
              key={r.id}
              className="bg-[#121215] border border-zinc-800 rounded-2xl p-5 flex items-center justify-between"
            >
              <div>
                <h3 className="text-base font-bold text-zinc-100">
                  {r.customerName}
                </h3>
                <p className="text-xs text-zinc-400 mt-1">
                  {formatShortDate(r.dateTime)} às {formatTimeHHMM(r.dateTime)}{' '}
                  · {r.guestCount} convidados · Tel: {r.customerPhone}
                </p>
              </div>
              <span className="px-3 py-1 rounded-xl bg-indigo-950/80 text-indigo-300 text-xs font-semibold">
                {r.tableId ? `Mesa ${formatTableNumber(r.tableId)}` : 'Salão'}
              </span>
            </div>
          ))}
        </div>
      )}

      {section === 'pedidos' && (
        <div className="space-y-4">
          {orders.map((o) => (
            <div
              key={o.id}
              className="bg-[#121215] border border-zinc-800 rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
            >
              <div>
                <div className="flex items-center gap-2.5">
                  <span className="text-base font-bold text-zinc-100">
                    Mesa {formatTableNumber(o.table?.number ?? o.tableId)}
                  </span>
                  <span className="text-xs text-zinc-400">
                    {formatOrderDisplayNumber(o.id)}
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      o.status === 'OPEN'
                        ? 'bg-amber-950/80 text-amber-400'
                        : 'bg-zinc-800 text-zinc-400'
                    }`}
                  >
                    {o.status === 'OPEN' ? 'ABERTO' : 'FECHADO'}
                  </span>
                </div>
                <p className="text-xs text-zinc-400 mt-1">
                  {o.orderItems
                    .map(
                      (i) =>
                        `${i.quantity}x ${i.product?.name || `Item #${i.productId}`}`,
                    )
                    .join(' · ') || 'Sem itens'}
                </p>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <p className="text-xs text-zinc-500">Total (+10%)</p>
                  <p className="text-lg font-bold text-zinc-100">
                    {formatCurrency(o.totalAmount * 1.1)}
                  </p>
                </div>
                {o.status === 'OPEN' && (
                  <button
                    type="button"
                    onClick={async () => {
                      await closeOrderApi(o.id);
                      loadData();
                    }}
                    className="h-9 px-3.5 rounded-xl bg-zinc-100 text-zinc-950 text-xs font-semibold"
                  >
                    Fechar conta
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {section === 'funcionarios' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {staff.map((u) => (
            <div
              key={u.id}
              className="bg-[#121215] border border-zinc-800 rounded-2xl p-5 flex items-center justify-between"
            >
              <div>
                <p className="text-sm font-bold text-zinc-100">{u.name}</p>
                <p className="text-xs text-zinc-400">{u.email}</p>
              </div>
              <span className="px-2.5 py-1 rounded bg-zinc-800 text-zinc-300 text-xs font-semibold">
                {u.role}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

