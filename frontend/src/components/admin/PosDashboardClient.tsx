'use client';

import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  addOrderItemApi,
  closeOrderApi,
  deleteProductApi,
  fetchDashboardData,
  INITIAL_DEMO_STATE,
  openOrderApi,
  removeOrderItemApi,
  subscribeRealtimeSync,
  transferOrderApi,
  updateOrderItemQuantityApi,
} from '@/lib/api';
import { getClientUser } from '@/lib/auth-cookies';
import {
  formatCurrency,
  formatElapsedMinutes,
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
  TableStatus,
} from '@/types/restaurant';

/**
 * CLIENT COMPONENT (`'use client'`)
 * Dashboard principal da Área de Atendimento fiel ao Print 1:
 * - Coluna 1: Mesas e reservas (com filtros TODAS, DISPONÍVEIS, OCUPADAS, RESERVADAS e Próximas reservas)
 * - Coluna 2: Catálogo de produtos (busca ⌘K, filtros por categoria, seletor de quantidade, exclusão e adição)
 * - Coluna 3: Pedido ativo (itens da mesa selecionada, subtotal, taxa de 10%, total a pagar, fechar conta, imprimir e transferir mesa)
 * - Integrado em tempo real com a tela pública `/cardapio` dos clientes.
 */
export default function PosDashboardClient() {
  const [tables, setTables] = useState<Table[]>(INITIAL_DEMO_STATE.tables);
  const [products, setProducts] = useState<Product[]>(
    INITIAL_DEMO_STATE.products,
  );
  const [reservations, setReservations] = useState<Reservation[]>(
    INITIAL_DEMO_STATE.reservations,
  );
  const [orders, setOrders] = useState<Order[]>(INITIAL_DEMO_STATE.orders);

  // Seleciona a Mesa 04 por padrão como no print de referência
  const [selectedTableId, setSelectedTableId] = useState<number>(4);

  // Controles da Coluna 1 (Mesas e Reservas)
  const [leftTab, setLeftTab] = useState<'tables' | 'reservations'>('tables');
  const [tableFilter, setTableFilter] = useState<'ALL' | TableStatus>('ALL');
  const [showUpcomingReservations, setShowUpcomingReservations] =
    useState<boolean>(true);

  // Controles da Coluna 2 (Catálogo de Produtos)
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [productQuantities, setProductQuantities] = useState<
    Record<number, number>
  >({});
  const searchInputRef = useRef<HTMLInputElement | null>(null);

  // Controles da Coluna 3 (Pedido Ativo)
  const [orderNote, setOrderNote] = useState<string>('');
  const [editingOrderNote, setEditingOrderNote] = useState<boolean>(false);
  const [transferModalOpen, setTransferModalOpen] = useState<boolean>(false);
  const [targetTransferTableId, setTargetTransferTableId] =
    useState<string>('');
  const [receiptModalOpen, setReceiptModalOpen] = useState<boolean>(false);

  // Notificação em tempo real (ex: quando cliente pede pelo /cardapio)
  const [liveAlert, setLiveAlert] = useState<string | null>(null);
  const [busyAction, setBusyAction] = useState<boolean>(false);

  const loadAll = useCallback(async () => {
    const { snapshot } = await fetchDashboardData();
    // Se o banco SQLite estiver recém-criado e sem mesas/produtos ainda, preserva visualização ou dados existentes
    if (snapshot.tables.length > 0 || snapshot.products.length > 0) {
      setTables(snapshot.tables);
      setProducts(snapshot.products);
      setReservations(snapshot.reservations);
      setOrders(snapshot.orders);
    }
  }, []);

  useEffect(() => {
    loadAll();

    const unsubscribe = subscribeRealtimeSync((payload) => {
      loadAll();
      if (payload.reason === 'customer_order_submitted') {
        const num = payload.tableNumber
          ? ` na Mesa ${formatTableNumber(payload.tableNumber)}`
          : '';
        setLiveAlert(
          `🔔 Novo pedido recebido do Cardápio Digital do Cliente${num}!`,
        );
      }
    });

    const onAdminMutated = () => loadAll();
    window.addEventListener('admin-data-mutated', onAdminMutated);

    const interval = setInterval(loadAll, 5000);
    return () => {
      unsubscribe();
      window.removeEventListener('admin-data-mutated', onAdminMutated);
      clearInterval(interval);
    };
  }, [loadAll]);

  // Atalho de teclado ⌘K / Ctrl+K para focar na busca de produtos
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    if (!liveAlert) return;
    const timer = setTimeout(() => setLiveAlert(null), 5000);
    return () => clearTimeout(timer);
  }, [liveAlert]);

  const selectedTable = useMemo(
    () =>
      tables.find((t) => t.id === selectedTableId) ??
      tables.find((t) => t.number === 4) ??
      tables[0],
    [tables, selectedTableId],
  );

  const activeOrder = useMemo(() => {
    if (!selectedTable) return null;
    return (
      orders.find(
        (o) => o.tableId === selectedTable.id && o.status === 'OPEN',
      ) ?? null
    );
  }, [orders, selectedTable]);

  const filteredTables = useMemo(() => {
    if (tableFilter === 'ALL') return tables;
    return tables.filter((t) => t.status === tableFilter);
  }, [tables, tableFilter]);

  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchesSearch =
        !searchQuery.trim() ||
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (p.description || '')
          .toLowerCase()
          .includes(searchQuery.toLowerCase());

      const matchesCategory =
        selectedCategory === 'ALL' ||
        p.category.toLowerCase() === selectedCategory.toLowerCase();

      return matchesSearch && matchesCategory;
    });
  }, [products, searchQuery, selectedCategory]);

  function getQty(productId: number): number {
    return productQuantities[productId] ?? 1;
  }

  function changeProductQty(productId: number, delta: number) {
    setProductQuantities((prev) => {
      const current = prev[productId] ?? 1;
      return { ...prev, [productId]: Math.max(1, current + delta) };
    });
  }

  async function handleSelectOrOpenTable(table: Table) {
    setSelectedTableId(table.id);
    const hasOpenOrder = orders.some(
      (o) => o.tableId === table.id && o.status === 'OPEN',
    );
    if (table.status === 'AVAILABLE' && !hasOpenOrder) {
      // Permite abrir comanda imediatamente ao clicar em "Abrir pedido +"
    }
  }

  async function handleOpenOrderForTable(table: Table) {
    setBusyAction(true);
    try {
      const user = getClientUser();
      const created = await openOrderApi(table.id, user?.id ?? 1);
      setSelectedTableId(table.id);
      await loadAll();
      setLiveAlert(
        `Comanda ${formatOrderDisplayNumber(created.id)} aberta para a Mesa ${formatTableNumber(table.number)}`,
      );
    } catch (err) {
      setLiveAlert(
        err instanceof Error ? err.message : 'Erro ao abrir comanda na mesa',
      );
    } finally {
      setBusyAction(false);
    }
  }

  async function handleAddProductToSelectedTable(product: Product) {
    if (!selectedTable) return;
    setBusyAction(true);
    const qty = getQty(product.id);

    try {
      let targetOrder = activeOrder;
      if (!targetOrder) {
        const user = getClientUser();
        targetOrder = await openOrderApi(selectedTable.id, user?.id ?? 1);
      }

      await addOrderItemApi(targetOrder.id, {
        productId: product.id,
        quantity: qty,
        notes: orderNote.trim() || undefined,
      });

      setProductQuantities((prev) => ({ ...prev, [product.id]: 1 }));
      await loadAll();
    } catch (err) {
      setLiveAlert(
        err instanceof Error
          ? err.message
          : 'Não foi possível adicionar o produto ao pedido.',
      );
    } finally {
      setBusyAction(false);
    }
  }

  async function handleDeleteProduct(product: Product) {
    setBusyAction(true);
    try {
      await deleteProductApi(product.id);
      await loadAll();
    } catch (err) {
      setLiveAlert(
        err instanceof Error
          ? err.message
          : 'Não foi possível remover o produto.',
      );
    } finally {
      setBusyAction(false);
    }
  }

  async function handleChangeOrderItemQty(itemId: number, nextQty: number) {
    if (!activeOrder) return;
    setBusyAction(true);
    try {
      await updateOrderItemQuantityApi(activeOrder.id, itemId, nextQty);
      await loadAll();
    } finally {
      setBusyAction(false);
    }
  }

  async function handleRemoveOrderItem(itemId: number) {
    if (!activeOrder) return;
    setBusyAction(true);
    try {
      await removeOrderItemApi(activeOrder.id, itemId);
      await loadAll();
    } finally {
      setBusyAction(false);
    }
  }

  async function handleCloseActiveOrder() {
    if (!activeOrder || !selectedTable) return;
    setBusyAction(true);
    try {
      await closeOrderApi(activeOrder.id);
      await loadAll();
      setLiveAlert(
        `Conta ${formatOrderDisplayNumber(activeOrder.id)} da Mesa ${formatTableNumber(selectedTable.number)} encerrada e recebida com sucesso!`,
      );
    } finally {
      setBusyAction(false);
    }
  }

  async function handleTransferTable(e: React.FormEvent) {
    e.preventDefault();
    if (!activeOrder || !targetTransferTableId) return;
    setBusyAction(true);
    try {
      const targetId = Number(targetTransferTableId);
      await transferOrderApi(activeOrder.id, targetId);
      setSelectedTableId(targetId);
      setTransferModalOpen(false);
      setTargetTransferTableId('');
      await loadAll();
      setLiveAlert('Comanda transferida de mesa com sucesso!');
    } finally {
      setBusyAction(false);
    }
  }

  const totalItemsInActiveOrder = useMemo(() => {
    if (!activeOrder) return 0;
    return activeOrder.orderItems.reduce((sum, i) => sum + i.quantity, 0);
  }, [activeOrder]);

  const subtotal = useMemo(() => {
    if (!activeOrder) return 0;
    return activeOrder.orderItems.reduce(
      (sum, i) => sum + i.unitPrice * i.quantity,
      0,
    );
  }, [activeOrder]);

  const serviceFee = subtotal * 0.1;
  const totalPayable = subtotal + serviceFee;

  const availableTablesForTransfer = useMemo(
    () => tables.filter((t) => t.status !== 'OCCUPIED'),
    [tables],
  );

  return (
    <div className="space-y-5">
      {/* Alerta em Tempo Real quando chega pedido do Cardápio do Cliente */}
      {liveAlert && (
        <div
          role="status"
          className="rounded-xl bg-emerald-950/60 border border-emerald-700/60 px-4 py-2.5 text-xs text-emerald-200 flex items-center justify-between shadow-lg"
        >
          <span className="font-medium">{liveAlert}</span>
          <button
            type="button"
            onClick={() => setLiveAlert(null)}
            className="text-emerald-300 hover:text-white ml-4"
          >
            ✕
          </button>
        </div>
      )}

      {/* Subheader: Área de atendimento + Turno/Data/Hora (idêntico ao Print 1) */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 pb-1">
        <div>
          <h1 className="text-[26px] font-bold text-zinc-100 tracking-tight leading-tight">
            Área de atendimento
          </h1>
          <p className="text-xs text-zinc-500 mt-1">
            Salão, cardápio e pedidos abertos em um só lugar.
          </p>
        </div>

        <div className="flex items-center gap-3 text-xs text-zinc-400">
          <span className="inline-flex items-center gap-1.5 text-zinc-300">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            <span>Jantar</span>
          </span>
          <span className="text-zinc-500">Ter, 20 out 2026</span>
          <span className="text-sm font-bold text-zinc-100">19:12</span>
        </div>
      </div>

      {/* Grid Principal de 3 Colunas idêntico ao Print 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* ============================================================
            COLUNA 1: MESAS E RESERVAS
        ============================================================ */}
        <section className="lg:col-span-3 bg-[#101013] border border-zinc-800/80 rounded-2xl p-4 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-zinc-100">
              Mesas e reservas
            </h2>
            <span className="text-xs text-zinc-500">
              {tables.length} mesas
            </span>
          </div>

          {/* Toggle Mesas | Reservas */}
          <div className="grid grid-cols-2 p-1 rounded-xl bg-[#16161a] border border-zinc-800/80 text-xs font-medium">
            <button
              type="button"
              onClick={() => setLeftTab('tables')}
              className={`py-1.5 rounded-lg transition-colors ${
                leftTab === 'tables'
                  ? 'bg-zinc-800 text-zinc-100 shadow-sm'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              Mesas
            </button>
            <button
              type="button"
              onClick={() => setLeftTab('reservations')}
              className={`py-1.5 rounded-lg transition-colors ${
                leftTab === 'reservations'
                  ? 'bg-zinc-800 text-zinc-100 shadow-sm'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              Reservas
            </button>
          </div>

          {leftTab === 'tables' ? (
            <>
              {/* Pílulas de Filtro: TODAS | DISPONÍVEIS | OCUPADAS | RESERVADAS */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5">
                {(
                  [
                    { key: 'ALL', label: 'TODAS' },
                    { key: 'AVAILABLE', label: 'DISPONÍVEIS' },
                    { key: 'OCCUPIED', label: 'OCUPADAS' },
                    { key: 'RESERVED', label: 'RESERVADAS' },
                  ] as const
                ).map((pill) => (
                  <button
                    key={pill.key}
                    type="button"
                    onClick={() => setTableFilter(pill.key)}
                    className={`px-2.5 py-1 rounded-full text-[10px] font-semibold tracking-wider transition-colors border whitespace-nowrap ${
                      tableFilter === pill.key
                        ? 'bg-zinc-800 text-zinc-100 border-zinc-600'
                        : 'bg-[#151519] text-zinc-500 border-zinc-800/80 hover:text-zinc-300'
                    }`}
                  >
                    {pill.label}
                  </button>
                ))}
              </div>

              {/* Grid 2x3 de Cards de Mesas */}
              <div className="grid grid-cols-2 gap-2.5">
                {filteredTables.map((table) => {
                  const isSelected = selectedTable?.id === table.id;
                  const tableOrder = orders.find(
                    (o) => o.tableId === table.id && o.status === 'OPEN',
                  );
                  const tableRes = reservations.find(
                    (r) => r.tableId === table.id,
                  );

                  const shortCustomer = tableRes
                    ? (() => {
                        const parts = tableRes.customerName.split(' ');
                        return parts.length > 1
                          ? `${parts[0]} ${parts[1][0]}.`
                          : parts[0];
                      })()
                    : 'Reserva';

                  return (
                    <div
                      key={table.id}
                      onClick={() => handleSelectOrOpenTable(table)}
                      className={`cursor-pointer rounded-xl p-3 transition-all border flex flex-col justify-between min-h-[108px] ${
                        isSelected
                          ? 'bg-[#1a1a20] border-zinc-500 shadow-md'
                          : 'bg-[#141418] border-zinc-800/80 hover:border-zinc-700'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-bold text-zinc-100">
                          Mesa {formatTableNumber(table.number)}
                        </span>
                        {isSelected ? (
                          <span className="w-4 h-4 rounded-full bg-zinc-200 text-zinc-950 flex items-center justify-center text-[10px] font-bold">
                            ✓
                          </span>
                        ) : (
                          <span className="text-[11px] text-zinc-500">
                            {table.capacity} lugares
                          </span>
                        )}
                      </div>

                      <div className="my-2">
                        {table.status === 'AVAILABLE' && (
                          <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold tracking-wide bg-emerald-950/80 text-emerald-400 border border-emerald-800/50">
                            DISPONÍVEL
                          </span>
                        )}
                        {table.status === 'OCCUPIED' && (
                          <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold tracking-wide bg-amber-950/80 text-amber-400 border border-amber-800/50">
                            OCUPADA
                          </span>
                        )}
                        {table.status === 'RESERVED' && (
                          <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold tracking-wide bg-indigo-950/90 text-indigo-400 border border-indigo-800/50">
                            RESERVADA
                          </span>
                        )}
                      </div>

                      <div className="flex items-center justify-between text-[11px] pt-1">
                        {table.status === 'AVAILABLE' && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenOrderForTable(table);
                            }}
                            className="w-full flex items-center justify-between text-zinc-200 font-medium hover:text-white"
                          >
                            <span>Abrir pedido</span>
                            <span className="text-zinc-400 text-sm leading-none">
                              +
                            </span>
                          </button>
                        )}

                        {table.status === 'OCCUPIED' && (
                          <div className="w-full flex items-center justify-between text-zinc-400">
                            <span>
                              Pedido{' '}
                              {tableOrder
                                ? formatOrderDisplayNumber(tableOrder.id)
                                : `#${1038 + table.number}`}
                            </span>
                            <span className="text-zinc-500">↗</span>
                          </div>
                        )}

                        {table.status === 'RESERVED' && (
                          <div className="w-full flex items-center justify-between text-zinc-300">
                            <span className="truncate">
                              {shortCustomer} ·{' '}
                              {tableRes
                                ? formatTimeHHMM(tableRes.dateTime)
                                : '19:30'}
                            </span>
                            <span className="text-zinc-400">↗</span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          ) : (
            /* Aba dedicada de Reservas na Coluna 1 */
            <div className="space-y-2.5">
              {reservations.map((res) => (
                <div
                  key={res.id}
                  onClick={() => {
                    if (res.tableId) setSelectedTableId(res.tableId);
                  }}
                  className="cursor-pointer rounded-xl bg-[#141418] border border-zinc-800/80 hover:border-zinc-700 p-3 space-y-1"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-zinc-100">
                      {res.customerName}
                    </span>
                    <span className="text-[11px] text-indigo-400 font-medium">
                      {res.table
                        ? `Mesa ${formatTableNumber(res.table.number)} ↗`
                        : res.tableId
                          ? `Mesa ${formatTableNumber(res.tableId)} ↗`
                          : 'A definir'}
                    </span>
                  </div>
                  <p className="text-[11px] text-zinc-500">
                    {formatShortDate(res.dateTime)} ·{' '}
                    {formatTimeHHMM(res.dateTime)} · {res.guestCount} convidados
                  </p>
                  <p className="text-[11px] text-zinc-500">
                    Tel: {res.customerPhone}
                  </p>
                </div>
              ))}
            </div>
          )}

          {/* Card Inferior: Próximas reservas (idêntico ao Print 1) */}
          <div className="rounded-xl bg-[#141418] border border-zinc-800/80 p-3.5 space-y-3">
            <button
              type="button"
              onClick={() => setShowUpcomingReservations((prev) => !prev)}
              className="w-full flex items-center justify-between text-xs font-semibold text-zinc-200"
            >
              <span className="flex items-center gap-2">
                <span className="text-zinc-400">📅</span>
                <span>Próximas reservas</span>
                <span className="text-zinc-500 font-normal">
                  {reservations.length}
                </span>
              </span>
              <span className="text-zinc-500">
                {showUpcomingReservations ? '⌃' : '⌄'}
              </span>
            </button>

            {showUpcomingReservations && (
              <div className="space-y-3 pt-1">
                {reservations.map((res) => {
                  const tableNum =
                    res.table?.number ??
                    tables.find((t) => t.id === res.tableId)?.number ??
                    1;
                  return (
                    <div
                      key={res.id}
                      onClick={() => {
                        if (res.tableId) setSelectedTableId(res.tableId);
                      }}
                      className="cursor-pointer flex items-center justify-between gap-2 group"
                    >
                      <div>
                        <p className="text-xs font-semibold text-zinc-200 group-hover:text-white">
                          {res.customerName}
                        </p>
                        <p className="text-[11px] text-zinc-500">
                          {formatShortDate(res.dateTime)} ·{' '}
                          {formatTimeHHMM(res.dateTime)} · {res.guestCount}{' '}
                          convidados
                        </p>
                      </div>
                      <span className="text-xs font-medium text-indigo-400 group-hover:text-indigo-300 whitespace-nowrap">
                        Mesa {formatTableNumber(tableNum)} ↗
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </section>

        {/* ============================================================
            COLUNA 2: CATÁLOGO DE PRODUTOS
        ============================================================ */}
        <section className="lg:col-span-5 bg-[#101013] border border-zinc-800/80 rounded-2xl p-4 space-y-4">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-baseline gap-2">
              <h2 className="text-base font-bold text-zinc-100">
                Catálogo de produtos
              </h2>
              <span className="text-xs text-zinc-500">
                {products.length} produtos
              </span>
            </div>
            {selectedTable && (
              <span className="text-xs text-zinc-400">
                Adicionando à{' '}
                <strong className="text-zinc-200 font-semibold">
                  Mesa {formatTableNumber(selectedTable.number)}
                </strong>
              </span>
            )}
          </div>

          {/* Barra de Busca com atalho ⌘K */}
          <div className="relative">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500 text-xs">
              🔍
            </span>
            <input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar produtos..."
              className="w-full h-10 pl-9 pr-14 rounded-xl bg-[#151519] border border-zinc-800/90 text-xs text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:border-zinc-600"
            />
            <kbd className="absolute right-3 top-1/2 -translate-y-1/2 px-1.5 py-0.5 rounded bg-zinc-800/90 border border-zinc-700/70 text-[10px] text-zinc-400 font-sans">
              ⌘ K
            </kbd>
          </div>

          {/* Pílulas de Categoria idênticas ao Print 1 */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5">
            {(
              [
                { key: 'ALL', label: 'Todos os produtos' },
                { key: 'Bebida', label: 'Bebidas' },
                { key: 'Sobremesa', label: 'Sobremesas' },
                { key: 'Prato principal', label: 'Pratos principais' },
                { key: 'Entrada', label: 'Entradas' },
              ] as const
            ).map((cat) => (
              <button
                key={cat.key}
                type="button"
                onClick={() => setSelectedCategory(cat.key)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors border ${
                  selectedCategory === cat.key
                    ? 'bg-zinc-800 text-zinc-100 border-zinc-600'
                    : 'bg-[#151519] text-zinc-400 border-zinc-800/90 hover:text-zinc-200'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* Grid 2x3 de Produtos idêntico ao Print 1 */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {filteredProducts.map((product) => {
              const qty = getQty(product.id);
              return (
                <div
                  key={product.id}
                  className="bg-[#151519] border border-zinc-800/90 hover:border-zinc-700/80 rounded-2xl p-3.5 flex flex-col justify-between gap-3 transition-colors"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-medium bg-zinc-800 text-zinc-400">
                        {product.category}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleDeleteProduct(product)}
                        title="Remover produto do cardápio"
                        className="text-zinc-500 hover:text-red-400 transition-colors p-1"
                      >
                        <svg
                          width="13"
                          height="13"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <polyline points="3 6 5 6 21 6" />
                          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                        </svg>
                      </button>
                    </div>

                    <h3 className="text-sm font-semibold text-zinc-100">
                      {product.name}
                    </h3>
                  </div>

                  <div className="space-y-3 pt-1">
                    <div className="flex items-center justify-between">
                      <span className="text-base font-bold text-zinc-100">
                        {formatCurrency(product.price)}
                      </span>

                      <div className="flex items-center bg-[#101013] border border-zinc-800 rounded-xl h-8 px-1">
                        <button
                          type="button"
                          onClick={() => changeProductQty(product.id, -1)}
                          className="w-6 h-full text-zinc-400 hover:text-zinc-100 text-xs"
                        >
                          −
                        </button>
                        <span className="w-6 text-center text-xs font-semibold text-zinc-100">
                          {qty}
                        </span>
                        <button
                          type="button"
                          onClick={() => changeProductQty(product.id, 1)}
                          className="w-6 h-full text-zinc-400 hover:text-zinc-100 text-xs"
                        >
                          +
                        </button>
                      </div>
                    </div>

                    <button
                      type="button"
                      disabled={busyAction}
                      onClick={() => handleAddProductToSelectedTable(product)}
                      className="w-full h-9 rounded-xl bg-zinc-100 hover:bg-white disabled:opacity-60 text-zinc-950 font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors"
                    >
                      <span>+</span>
                      <span>Adicionar ao pedido</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Rodapé do Catálogo de Produtos */}
          <div className="pt-1 flex items-center justify-between text-[11px] text-zinc-500">
            <span>Mostrando todos os {filteredProducts.length} produtos</span>
            <span className="font-mono text-[10px] text-zinc-600">
              GET /api/products
            </span>
          </div>
        </section>

        {/* ============================================================
            COLUNA 3: PEDIDO ATIVO
        ============================================================ */}
        <section className="lg:col-span-4 bg-[#101013] border border-zinc-800/80 rounded-2xl p-4 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-zinc-400 text-sm">🧾</span>
              <h2 className="text-base font-bold text-zinc-100">
                Pedido ativo
              </h2>
            </div>
            {activeOrder ? (
              <span className="px-2.5 py-0.5 rounded text-[10px] font-bold tracking-wider bg-amber-950/80 text-amber-400 border border-amber-800/50">
                ABERTO
              </span>
            ) : (
              <span className="px-2.5 py-0.5 rounded text-[10px] font-bold tracking-wider bg-zinc-800 text-zinc-400">
                SEM COMANDA
              </span>
            )}
          </div>

          {/* Card Resumo da Mesa Selecionada */}
          {selectedTable && (
            <div className="rounded-xl bg-[#151519] border border-zinc-800/90 p-3.5 flex items-center justify-between">
              <div>
                <div className="flex items-baseline gap-2">
                  <span className="text-base font-bold text-zinc-100">
                    Mesa {formatTableNumber(selectedTable.number)}
                  </span>
                  {activeOrder && (
                    <span className="text-xs text-zinc-500 font-medium">
                      {formatOrderDisplayNumber(activeOrder.id)}
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-zinc-500 mt-0.5">
                  {selectedTable.capacity} convidados ·{' '}
                  {activeOrder
                    ? `Aberto ${formatTimeHHMM(activeOrder.openedAt)} · ${formatElapsedMinutes(activeOrder.openedAt)}`
                    : 'Mesa aguardando abertura de pedido'}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setReceiptModalOpen(true)}
                className="w-8 h-8 rounded-lg hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 flex items-center justify-center"
                title="Opções da comanda"
              >
                •••
              </button>
            </div>
          )}

          {!activeOrder ? (
            <div className="py-12 px-4 text-center rounded-xl border border-dashed border-zinc-800 space-y-3">
              <p className="text-sm font-medium text-zinc-300">
                Nenhum pedido aberto na{' '}
                {selectedTable
                  ? `Mesa ${formatTableNumber(selectedTable.number)}`
                  : 'mesa selecionada'}
              </p>
              <p className="text-xs text-zinc-500">
                Clique abaixo para abrir uma comanda ou adicione qualquer produto do catálogo diretamente.
              </p>
              {selectedTable && (
                <button
                  type="button"
                  onClick={() => handleOpenOrderForTable(selectedTable)}
                  className="h-9 px-4 rounded-xl bg-zinc-100 hover:bg-white text-zinc-950 font-semibold text-xs"
                >
                  + Abrir pedido nesta mesa
                </button>
              )}
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between text-xs text-zinc-400 pt-1">
                <span>
                  <strong className="text-zinc-200 font-semibold">
                    Itens neste pedido
                  </strong>{' '}
                  · {totalItemsInActiveOrder} itens
                </span>
                <span className="text-[11px] text-zinc-500">BRL / R$</span>
              </div>

              {/* Lista de Itens do Pedido Ativo idêntica ao Print 1 */}
              <div className="divide-y divide-zinc-800/80 max-h-[300px] overflow-y-auto pr-1">
                {activeOrder.orderItems.length === 0 ? (
                  <p className="py-6 text-center text-xs text-zinc-500">
                    Comanda aberta. Adicione produtos pelo catálogo ao lado.
                  </p>
                ) : (
                  activeOrder.orderItems.map((item) => (
                    <div
                      key={item.id}
                      className="py-3 flex items-center justify-between gap-3"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-semibold text-zinc-100 truncate">
                          {item.product?.name || `Produto #${item.productId}`}
                        </p>
                        <p className="text-[11px] text-zinc-500 mt-0.5">
                          {formatCurrency(item.unitPrice)} cada
                        </p>
                        {item.notes && (
                          <p className="text-[10px] text-emerald-400/90 mt-0.5 truncate">
                            {item.notes}
                          </p>
                        )}
                      </div>

                      <div className="flex items-center bg-[#151519] border border-zinc-800 rounded-xl h-8 px-1">
                        <button
                          type="button"
                          onClick={() =>
                            handleChangeOrderItemQty(item.id, item.quantity - 1)
                          }
                          className="w-6 h-full text-zinc-400 hover:text-zinc-100 text-xs"
                        >
                          −
                        </button>
                        <span className="w-6 text-center text-xs font-semibold text-zinc-100">
                          {item.quantity}
                        </span>
                        <button
                          type="button"
                          onClick={() =>
                            handleChangeOrderItemQty(item.id, item.quantity + 1)
                          }
                          className="w-6 h-full text-zinc-400 hover:text-zinc-100 text-xs"
                        >
                          +
                        </button>
                      </div>

                      <div className="text-right min-w-[54px]">
                        <p className="text-xs font-bold text-zinc-100">
                          {formatCurrency(
                            item.unitPrice * item.quantity,
                            false,
                          )}
                        </p>
                        <button
                          type="button"
                          onClick={() => handleRemoveOrderItem(item.id)}
                          className="text-xs text-zinc-500 hover:text-red-400 leading-none mt-1"
                          title="Remover item"
                        >
                          ×
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Observação do Pedido */}
              <div className="pt-1">
                {!editingOrderNote ? (
                  <button
                    type="button"
                    onClick={() => setEditingOrderNote(true)}
                    className="text-xs text-zinc-500 hover:text-zinc-300 flex items-center gap-1.5 transition-colors"
                  >
                    <span>📝</span>
                    <span>
                      {orderNote
                        ? `Observação: ${orderNote}`
                        : 'Adicionar observação a este pedido'}
                    </span>
                  </button>
                ) : (
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={orderNote}
                      onChange={(e) => setOrderNote(e.target.value)}
                      placeholder="Ex: Sem cebola, cliente com pressa..."
                      className="flex-1 h-8 px-3 rounded-lg bg-[#151519] border border-zinc-700 text-xs text-zinc-100"
                    />
                    <button
                      type="button"
                      onClick={() => setEditingOrderNote(false)}
                      className="h-8 px-3 rounded-lg bg-zinc-800 text-xs text-zinc-200"
                    >
                      OK
                    </button>
                  </div>
                )}
              </div>

              {/* Resumo Financeiro: Subtotal, Taxa de Serviço (10%) e Total a pagar */}
              <div className="pt-3 border-t border-zinc-800/80 space-y-2 text-xs">
                <div className="flex items-center justify-between text-zinc-400">
                  <span>Subtotal</span>
                  <span className="text-zinc-200 font-medium">
                    {formatCurrency(subtotal)}
                  </span>
                </div>
                <div className="flex items-center justify-between text-zinc-400">
                  <span>Taxa de serviço (10%)</span>
                  <span className="text-zinc-200 font-medium">
                    {formatCurrency(serviceFee)}
                  </span>
                </div>
                <div className="pt-3 border-t border-zinc-800/80 flex items-baseline justify-between">
                  <span className="text-sm font-bold text-zinc-100">
                    Total a pagar
                  </span>
                  <span className="text-2xl font-bold text-zinc-100 tracking-tight">
                    {formatCurrency(totalPayable)}
                  </span>
                </div>
              </div>

              {/* Botões de Fechamento, Impressão e Transferência de Mesa */}
              <div className="space-y-2.5 pt-1">
                <button
                  type="button"
                  disabled={busyAction}
                  onClick={handleCloseActiveOrder}
                  className="w-full h-11 rounded-xl bg-zinc-100 hover:bg-white disabled:opacity-60 text-zinc-950 font-semibold text-xs flex items-center justify-center gap-2 transition-colors shadow-sm"
                >
                  <span>💳</span>
                  <span>Fechar conta e receber</span>
                </button>

                <div className="grid grid-cols-2 gap-2.5">
                  <button
                    type="button"
                    onClick={() => setReceiptModalOpen(true)}
                    className="h-9 rounded-xl bg-[#151519] hover:bg-zinc-800 border border-zinc-800 text-xs font-medium text-zinc-200 flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <span>🖨</span>
                    <span>Imprimir conta</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setTransferModalOpen(true)}
                    className="h-9 rounded-xl bg-[#151519] hover:bg-zinc-800 border border-zinc-800 text-xs font-medium text-zinc-200 flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <span>⇄</span>
                    <span>Transferir mesa</span>
                  </button>
                </div>
              </div>

              {/* Rodapé do Pedido Ativo */}
              <div className="pt-1 flex items-center justify-between text-[11px] text-zinc-500">
                <span className="font-mono text-[10px] text-zinc-600">
                  GET /api/orders/
                  {formatOrderDisplayNumber(activeOrder.id).replace('#', '')}
                </span>
                <span>Todas as alterações salvas</span>
              </div>
            </>
          )}
        </section>
      </div>

      {/* Modal de Transferência de Mesa */}
      {transferModalOpen && activeOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm bg-[#121215] border border-zinc-800 rounded-2xl p-6 space-y-4">
            <h3 className="text-base font-bold text-zinc-100">
              Transferir Comanda {formatOrderDisplayNumber(activeOrder.id)}
            </h3>
            <form onSubmit={handleTransferTable} className="space-y-4">
              <div>
                <label className="block text-xs text-zinc-400 mb-1.5">
                  Selecione a mesa de destino:
                </label>
                <select
                  required
                  value={targetTransferTableId}
                  onChange={(e) => setTargetTransferTableId(e.target.value)}
                  className="w-full h-10 px-3 rounded-xl bg-[#18181c] border border-zinc-800 text-sm text-zinc-100"
                >
                  <option value="">Escolha uma mesa livre...</option>
                  {availableTablesForTransfer.map((t) => (
                    <option key={t.id} value={t.id}>
                      Mesa {formatTableNumber(t.number)} ({t.capacity} lugares)
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setTransferModalOpen(false)}
                  className="h-9 px-3.5 rounded-xl bg-zinc-900 text-xs text-zinc-300"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="h-9 px-4 rounded-xl bg-zinc-100 text-zinc-950 text-xs font-semibold"
                >
                  Confirmar Transferência
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de Impressão / Prévia do Cupom da Conta */}
      {receiptModalOpen && activeOrder && selectedTable && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm bg-[#121215] border border-zinc-800 rounded-2xl p-6 space-y-4 font-mono text-xs">
            <div className="text-center border-b border-dashed border-zinc-700 pb-3">
              <p className="text-sm font-bold text-zinc-100">
                RESTAURANTE MESA
              </p>
              <p className="text-zinc-400">
                Mesa {formatTableNumber(selectedTable.number)} · Pedido{' '}
                {formatOrderDisplayNumber(activeOrder.id)}
              </p>
            </div>
            <div className="space-y-1.5">
              {activeOrder.orderItems.map((i) => (
                <div key={i.id} className="flex justify-between text-zinc-300">
                  <span>
                    {i.quantity}x {i.product?.name}
                  </span>
                  <span>{formatCurrency(i.unitPrice * i.quantity)}</span>
                </div>
              ))}
            </div>
            <div className="border-t border-dashed border-zinc-700 pt-3 space-y-1">
              <div className="flex justify-between text-zinc-400">
                <span>Subtotal</span>
                <span>{formatCurrency(subtotal)}</span>
              </div>
              <div className="flex justify-between text-zinc-400">
                <span>Serviço (10%)</span>
                <span>{formatCurrency(serviceFee)}</span>
              </div>
              <div className="flex justify-between text-sm font-bold text-zinc-100 pt-1">
                <span>TOTAL</span>
                <span>{formatCurrency(totalPayable)}</span>
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2 font-sans">
              <button
                type="button"
                onClick={() => setReceiptModalOpen(false)}
                className="h-9 px-3.5 rounded-xl bg-zinc-900 text-xs text-zinc-300"
              >
                Fechar
              </button>
              <button
                type="button"
                onClick={() => window.print()}
                className="h-9 px-4 rounded-xl bg-zinc-100 text-zinc-950 text-xs font-semibold"
              >
                🖨 Imprimir Agora
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

