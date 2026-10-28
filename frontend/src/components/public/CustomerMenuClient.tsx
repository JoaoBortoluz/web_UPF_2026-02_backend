'use client';

import React, { useEffect, useMemo, useState, useCallback } from 'react';
import {
  CustomerCartItem,
  Order,
  Product,
  Table,
} from '@/types/restaurant';
import {
  fetchPublicCustomerMenu,
  submitCustomerMenuOrder,
  subscribeRealtimeSync,
} from '@/lib/api';
import {
  CUSTOMER_CART_KEY,
  CUSTOMER_TABLE_KEY,
} from '@/lib/auth-cookies';
import {
  formatCurrency,
  formatOrderDisplayNumber,
  formatTableNumber,
  formatTimeHHMM,
} from '@/lib/format';

interface CustomerMenuClientProps {
  initialTableNumber?: number;
}

/**
 * CLIENT COMPONENT (`'use client'`)
 * Tela de Cardápio Digital para Autoatendimento dos Clientes na Mesa.
 * - Persiste a sacola e a mesa selecionada no `localStorage`
 * - Busca os produtos e as mesas em tempo real do Backend NestJS
 * - Envia os pedidos diretamente para a comanda ativa da mesa no Sistema de Gestão (`/atendimento`)
 */
export default function CustomerMenuClient({
  initialTableNumber,
}: CustomerMenuClientProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [tables, setTables] = useState<Table[]>([]);
  const [openOrders, setOpenOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  const [selectedTableId, setSelectedTableId] = useState<number>(4);
  const [customerName, setCustomerName] = useState<string>('');
  const [search, setSearch] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');

  // Quantidade temporária e observação nos cards de produto
  const [cardQuantities, setCardQuantities] = useState<Record<number, number>>(
    {},
  );
  const [cardNotes, setCardNotes] = useState<Record<number, string>>({});

  // Sacola do cliente persistida no localStorage
  const [cart, setCart] = useState<CustomerCartItem[]>([]);
  const [activeSideTab, setActiveSideTab] = useState<'cart' | 'bill'>('cart');

  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  const loadMenuData = useCallback(async () => {
    const data = await fetchPublicCustomerMenu();
    setProducts(data.products);
    setTables(data.tables);
    setOpenOrders(data.openOrders);
    setLoading(false);

    if (initialTableNumber) {
      const matched = data.tables.find((t) => t.number === initialTableNumber);
      if (matched) {
        setSelectedTableId(matched.id);
      }
    }
  }, [initialTableNumber]);

  // Inicializa dados e restaura sacola do localStorage
  useEffect(() => {
    loadMenuData();

    if (typeof window !== 'undefined') {
      try {
        const savedCart = localStorage.getItem(CUSTOMER_CART_KEY);
        if (savedCart) {
          setCart(JSON.parse(savedCart));
        }
        const savedTable = localStorage.getItem(CUSTOMER_TABLE_KEY);
        if (savedTable && !initialTableNumber) {
          setSelectedTableId(Number(savedTable));
        }
        const savedName = localStorage.getItem('restaurant_customer_name');
        if (savedName) {
          setCustomerName(savedName);
        }
      } catch {
        // Ignora erro de parse
      }
    }

    const unsubscribe = subscribeRealtimeSync(() => {
      loadMenuData();
    });

    const interval = setInterval(loadMenuData, 6000);
    return () => {
      unsubscribe();
      clearInterval(interval);
    };
  }, [loadMenuData, initialTableNumber]);

  // Salva sacola no localStorage sempre que alterada
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(CUSTOMER_CART_KEY, JSON.stringify(cart));
    }
  }, [cart]);

  useEffect(() => {
    if (typeof window !== 'undefined' && selectedTableId) {
      localStorage.setItem(CUSTOMER_TABLE_KEY, String(selectedTableId));
    }
  }, [selectedTableId]);

  const selectedTable = useMemo(
    () => tables.find((t) => t.id === selectedTableId) ?? tables[0],
    [tables, selectedTableId],
  );

  // Comanda ativa da mesa selecionada no sistema de gestão
  const activeTableOrder = useMemo(
    () =>
      openOrders.find(
        (o) => o.tableId === (selectedTable?.id ?? selectedTableId) && o.status === 'OPEN',
      ) ?? null,
    [openOrders, selectedTable, selectedTableId],
  );

  const categories = useMemo(() => {
    const base = ['Bebida', 'Sobremesa', 'Prato principal', 'Entrada'];
    const dynamic = Array.from(new Set(products.map((p) => p.category)));
    return Array.from(new Set([...base, ...dynamic])).filter(Boolean);
  }, [products]);

  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchesSearch =
        !search.trim() ||
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        (p.description || '').toLowerCase().includes(search.toLowerCase()) ||
        p.category.toLowerCase().includes(search.toLowerCase());

      const matchesCategory =
        selectedCategory === 'ALL' ||
        p.category.toLowerCase() === selectedCategory.toLowerCase();

      return matchesSearch && matchesCategory;
    });
  }, [products, search, selectedCategory]);

  function getCardQty(productId: number): number {
    return cardQuantities[productId] ?? 1;
  }

  function changeCardQty(productId: number, delta: number) {
    setCardQuantities((prev) => {
      const current = prev[productId] ?? 1;
      return { ...prev, [productId]: Math.max(1, current + delta) };
    });
  }

  function handleAddToCart(product: Product) {
    const qty = getCardQty(product.id);
    const note = (cardNotes[product.id] || '').trim();

    setCart((prev) => {
      const existingIndex = prev.findIndex(
        (item) => item.product.id === product.id && item.notes === note,
      );
      if (existingIndex >= 0) {
        const updated = [...prev];
        updated[existingIndex] = {
          ...updated[existingIndex],
          quantity: updated[existingIndex].quantity + qty,
        };
        return updated;
      }
      return [...prev, { product, quantity: qty, notes: note }];
    });

    setCardQuantities((prev) => ({ ...prev, [product.id]: 1 }));
    setCardNotes((prev) => ({ ...prev, [product.id]: '' }));
    setActiveSideTab('cart');
    setFeedback({
      type: 'success',
      text: `${qty}x ${product.name} adicionado à sua sacola!`,
    });
  }

  function updateCartItemQty(index: number, delta: number) {
    setCart((prev) => {
      const updated = [...prev];
      const nextQty = updated[index].quantity + delta;
      if (nextQty <= 0) {
        return updated.filter((_, i) => i !== index);
      }
      updated[index] = { ...updated[index], quantity: nextQty };
      return updated;
    });
  }

  function removeCartItem(index: number) {
    setCart((prev) => prev.filter((_, i) => i !== index));
  }

  const cartSubtotal = useMemo(
    () =>
      cart.reduce(
        (sum, item) => sum + item.product.price * item.quantity,
        0,
      ),
    [cart],
  );

  const cartTotalItems = useMemo(
    () => cart.reduce((sum, item) => sum + item.quantity, 0),
    [cart],
  );

  const tableSubtotal = activeTableOrder?.totalAmount ?? 0;
  const tableServiceFee = tableSubtotal * 0.1;
  const tableTotal = tableSubtotal + tableServiceFee;

  async function handleSendOrderToKitchen() {
    if (!selectedTable) return;
    if (cart.length === 0) return;

    setSubmitting(true);
    setFeedback(null);

    try {
      if (typeof window !== 'undefined' && customerName.trim()) {
        localStorage.setItem('restaurant_customer_name', customerName.trim());
      }

      const updatedOrder = await submitCustomerMenuOrder({
        tableId: selectedTable.id,
        customerName: customerName.trim() || undefined,
        items: cart.map((item) => ({
          productId: item.product.id,
          quantity: item.quantity,
          notes: item.notes || undefined,
        })),
      });

      setCart([]);
      if (typeof window !== 'undefined') {
        localStorage.removeItem(CUSTOMER_CART_KEY);
      }
      await loadMenuData();
      setActiveSideTab('bill');
      setFeedback({
        type: 'success',
        text: `Pedido enviado com sucesso para a Mesa ${formatTableNumber(selectedTable.number)} (${formatOrderDisplayNumber(updatedOrder.id)})! Já aparece na Área de Atendimento do restaurante.`,
      });
    } catch (err) {
      setFeedback({
        type: 'error',
        text:
          err instanceof Error
            ? err.message
            : 'Erro ao enviar pedido para a cozinha.',
      });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="max-w-[1440px] w-full mx-auto px-4 sm:px-6 py-6 space-y-6">
      {/* Cabeçalho do Cardápio Digital do Cliente */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 pb-5 border-b border-zinc-800/80">
        <div className="flex items-start gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-zinc-100 text-zinc-950 flex items-center justify-center shrink-0 shadow-sm mt-0.5">
            <svg
              width="22"
              height="22"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2" />
              <path d="M7 2v20" />
              <path d="M21 15V2v0a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3Zm0 0v7" />
            </svg>
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-2xl font-bold text-zinc-100 tracking-tight">
                Cardápio Digital · Restaurante Mesa
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                Autoatendimento Integrado
              </span>
            </div>
            <p className="text-sm text-zinc-400 mt-1">
              Escolha seus pratos e bebidas diretamente da sua mesa. Seu pedido é enviado na hora para a comanda no sistema de gestão.
            </p>
          </div>
        </div>

        {/* Seletor de Mesa e Identificação do Cliente */}
        <div className="flex flex-wrap items-center gap-3 bg-[#121215] border border-zinc-800/90 rounded-2xl p-3">
          <div>
            <label
              htmlFor="customer-table-select"
              className="block text-[11px] uppercase tracking-wider text-zinc-400 font-medium mb-1"
            >
              Sua Mesa
            </label>
            <select
              id="customer-table-select"
              value={selectedTable?.id ?? selectedTableId}
              onChange={(e) => setSelectedTableId(Number(e.target.value))}
              className="h-9 px-3 rounded-xl bg-[#18181c] border border-zinc-700/80 text-sm font-semibold text-zinc-100 focus:outline-none focus:border-zinc-400"
            >
              {tables.map((t) => (
                <option key={t.id} value={t.id}>
                  Mesa {formatTableNumber(t.number)} ({t.capacity} lugares) ·{' '}
                  {t.status === 'OCCUPIED'
                    ? 'Comanda Aberta'
                    : t.status === 'RESERVED'
                      ? 'Reservada'
                      : 'Disponível'}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label
              htmlFor="customer-name-input"
              className="block text-[11px] uppercase tracking-wider text-zinc-400 font-medium mb-1"
            >
              Seu Nome (opcional)
            </label>
            <input
              id="customer-name-input"
              type="text"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              placeholder="Ex: Ana Martins"
              className="h-9 px-3 rounded-xl bg-[#18181c] border border-zinc-800 text-sm text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:border-zinc-500 w-44"
            />
          </div>
        </div>
      </div>

      {/* Notificação de feedback */}
      {feedback && (
        <div
          role="status"
          className={`rounded-xl px-4 py-3 text-sm flex items-center justify-between border ${
            feedback.type === 'success'
              ? 'bg-emerald-950/40 border-emerald-800/60 text-emerald-200'
              : 'bg-red-950/40 border-red-800/60 text-red-200'
          }`}
        >
          <span>{feedback.text}</span>
          <button
            type="button"
            onClick={() => setFeedback(null)}
            className="text-xs opacity-75 hover:opacity-100 ml-4"
          >
            Fechar ✕
          </button>
        </div>
      )}

      {/* Grid Principal: Catálogo à esquerda (8 colunas) + Sacola/Conta da Mesa à direita (4 colunas) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Coluna do Cardápio */}
        <section className="lg:col-span-8 bg-[#111114] border border-zinc-800/80 rounded-2xl p-5 space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-baseline gap-2.5">
              <h2 className="text-lg font-semibold text-zinc-100">
                Catálogo do Cardápio
              </h2>
              <span className="text-xs text-zinc-500">
                {filteredProducts.length} produtos disponíveis
              </span>
            </div>
            {selectedTable && (
              <span className="text-xs text-zinc-400">
                Pedindo na{' '}
                <strong className="text-zinc-200">
                  Mesa {formatTableNumber(selectedTable.number)}
                </strong>
              </span>
            )}
          </div>

          {/* Barra de Busca */}
          <div className="relative">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500 text-sm">
              🔍
            </span>
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar pratos, entradas, bebidas ou sobremesas..."
              className="w-full h-11 pl-10 pr-4 rounded-xl bg-[#16161a] border border-zinc-800 text-sm text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:border-zinc-600"
            />
          </div>

          {/* Pílulas de Categoria */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            <button
              type="button"
              onClick={() => setSelectedCategory('ALL')}
              className={`px-3.5 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors border ${
                selectedCategory === 'ALL'
                  ? 'bg-zinc-800 text-zinc-100 border-zinc-600'
                  : 'bg-[#16161a] text-zinc-400 border-zinc-800/80 hover:text-zinc-200'
              }`}
            >
              Todos os produtos
            </button>
            {categories.map((cat) => {
              const label =
                cat === 'Bebida'
                  ? 'Bebidas'
                  : cat === 'Sobremesa'
                    ? 'Sobremesas'
                    : cat === 'Prato principal'
                      ? 'Pratos principais'
                      : cat === 'Entrada'
                        ? 'Entradas'
                        : cat;
              const isSelected =
                selectedCategory.toLowerCase() === cat.toLowerCase();
              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors border ${
                    isSelected
                      ? 'bg-zinc-800 text-zinc-100 border-zinc-600'
                      : 'bg-[#16161a] text-zinc-400 border-zinc-800/80 hover:text-zinc-200'
                  }`}
                >
                  {label}
                </button>
              );
            })}
          </div>

          {/* Lista de Produtos em 2 Colunas */}
          {loading ? (
            <div className="py-12 text-center text-sm text-zinc-500">
              Carregando cardápio...
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {filteredProducts.map((product) => {
                const qty = getCardQty(product.id);
                return (
                  <div
                    key={product.id}
                    className="bg-[#16161a] border border-zinc-800/90 hover:border-zinc-700/80 rounded-2xl p-4 flex flex-col justify-between gap-3 transition-colors"
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="inline-block px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-zinc-800/90 text-zinc-300 border border-zinc-700/50">
                          {product.category}
                        </span>
                      </div>

                      <h3 className="text-base font-semibold text-zinc-100">
                        {product.name}
                      </h3>

                      {product.description && (
                        <p className="text-xs text-zinc-400 leading-relaxed line-clamp-2">
                          {product.description}
                        </p>
                      )}
                    </div>

                    <div className="space-y-3 pt-2">
                      <div className="flex items-center justify-between">
                        <span className="text-lg font-bold text-zinc-100">
                          {formatCurrency(product.price)}
                        </span>

                        <div className="flex items-center bg-[#111114] border border-zinc-800 rounded-xl h-8 px-1">
                          <button
                            type="button"
                            onClick={() => changeCardQty(product.id, -1)}
                            className="w-7 h-full text-zinc-400 hover:text-zinc-100 text-sm font-medium"
                            aria-label="Diminuir quantidade"
                          >
                            −
                          </button>
                          <span className="w-7 text-center text-xs font-semibold text-zinc-100">
                            {qty}
                          </span>
                          <button
                            type="button"
                            onClick={() => changeCardQty(product.id, 1)}
                            className="w-7 h-full text-zinc-400 hover:text-zinc-100 text-sm font-medium"
                            aria-label="Aumentar quantidade"
                          >
                            +
                          </button>
                        </div>
                      </div>

                      <input
                        type="text"
                        value={cardNotes[product.id] || ''}
                        onChange={(e) =>
                          setCardNotes((prev) => ({
                            ...prev,
                            [product.id]: e.target.value,
                          }))
                        }
                        placeholder="Observação (ex: sem gelo, ao ponto)..."
                        className="w-full h-8 px-3 rounded-lg bg-[#111114] border border-zinc-800/80 text-xs text-zinc-200 placeholder:text-zinc-500 focus:outline-none focus:border-zinc-600"
                      />

                      <button
                        type="button"
                        onClick={() => handleAddToCart(product)}
                        className="w-full h-10 rounded-xl bg-zinc-100 hover:bg-white text-zinc-950 font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors"
                      >
                        <span>+</span>
                        <span>Adicionar ao pedido</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* Coluna Direita: Sacola do Cliente & Conta Ativa da Mesa */}
        <aside className="lg:col-span-4 bg-[#111114] border border-zinc-800/80 rounded-2xl p-5 space-y-5 sticky top-16">
          {/* Abas: Sacola Atual vs Comanda da Mesa */}
          <div className="grid grid-cols-2 p-1 rounded-xl bg-[#16161a] border border-zinc-800/80 text-xs font-medium">
            <button
              type="button"
              onClick={() => setActiveSideTab('cart')}
              className={`py-2 rounded-lg transition-colors flex items-center justify-center gap-1.5 ${
                activeSideTab === 'cart'
                  ? 'bg-zinc-800 text-zinc-100 shadow-sm'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <span>🛒 Sacola</span>
              {cartTotalItems > 0 && (
                <span className="px-1.5 py-0.2 rounded-full bg-zinc-100 text-zinc-950 text-[10px] font-bold">
                  {cartTotalItems}
                </span>
              )}
            </button>
            <button
              type="button"
              onClick={() => setActiveSideTab('bill')}
              className={`py-2 rounded-lg transition-colors flex items-center justify-center gap-1.5 ${
                activeSideTab === 'bill'
                  ? 'bg-zinc-800 text-zinc-100 shadow-sm'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <span>🧾 Conta da Mesa</span>
              {activeTableOrder && (
                <span className="w-2 h-2 rounded-full bg-amber-400" />
              )}
            </button>
          </div>

          {activeSideTab === 'cart' ? (
            /* VISÃO 1: SACOLA PARA ENVIAR À COZINHA */
            <div className="space-y-4">
              <div className="p-3.5 rounded-xl bg-[#16161a] border border-zinc-800/80 flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-zinc-100">
                    Mesa{' '}
                    {selectedTable
                      ? formatTableNumber(selectedTable.number)
                      : '04'}
                  </p>
                  <p className="text-xs text-zinc-400">
                    {customerName
                      ? `Cliente: ${customerName}`
                      : 'Novo envio para a comanda da mesa'}
                  </p>
                </div>
                <span className="px-2.5 py-1 rounded-md text-[11px] font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                  PRONTO P/ ENVIAR
                </span>
              </div>

              {cart.length === 0 ? (
                <div className="py-10 text-center space-y-2 border border-dashed border-zinc-800 rounded-xl px-4">
                  <p className="text-sm text-zinc-300 font-medium">
                    Sua sacola está vazia
                  </p>
                  <p className="text-xs text-zinc-500">
                    Adicione itens do catálogo ao lado para enviar seu pedido diretamente para a mesa.
                  </p>
                </div>
              ) : (
                <>
                  <div className="divide-y divide-zinc-800/80 max-h-80 overflow-y-auto pr-1">
                    {cart.map((item, idx) => (
                      <div
                        key={`${item.product.id}-${idx}`}
                        className="py-3 flex items-center justify-between gap-3"
                      >
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-zinc-100 truncate">
                            {item.product.name}
                          </p>
                          <p className="text-xs text-zinc-500">
                            {formatCurrency(item.product.price)} cada
                          </p>
                          {item.notes && (
                            <p className="text-[11px] text-amber-400/90 mt-0.5 truncate">
                              Obs: {item.notes}
                            </p>
                          )}
                        </div>

                        <div className="flex items-center bg-[#16161a] border border-zinc-800 rounded-xl h-8 px-1">
                          <button
                            type="button"
                            onClick={() => updateCartItemQty(idx, -1)}
                            className="w-6 h-full text-zinc-400 hover:text-zinc-100 text-xs"
                          >
                            −
                          </button>
                          <span className="w-6 text-center text-xs font-semibold text-zinc-100">
                            {item.quantity}
                          </span>
                          <button
                            type="button"
                            onClick={() => updateCartItemQty(idx, 1)}
                            className="w-6 h-full text-zinc-400 hover:text-zinc-100 text-xs"
                          >
                            +
                          </button>
                        </div>

                        <div className="text-right">
                          <p className="text-sm font-semibold text-zinc-100">
                            {formatCurrency(
                              item.product.price * item.quantity,
                              false,
                            )}
                          </p>
                          <button
                            type="button"
                            onClick={() => removeCartItem(idx)}
                            className="text-xs text-zinc-500 hover:text-red-400"
                          >
                            ×
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="pt-3 border-t border-zinc-800 space-y-2 text-xs">
                    <div className="flex justify-between text-zinc-400">
                      <span>Subtotal deste envio</span>
                      <span>{formatCurrency(cartSubtotal)}</span>
                    </div>
                    <div className="flex justify-between items-baseline pt-2">
                      <span className="text-sm font-semibold text-zinc-200">
                        Total do envio
                      </span>
                      <span className="text-xl font-bold text-zinc-100">
                        {formatCurrency(cartSubtotal)}
                      </span>
                    </div>
                  </div>

                  <button
                    type="button"
                    disabled={submitting}
                    onClick={handleSendOrderToKitchen}
                    className="w-full h-11 rounded-xl bg-zinc-100 hover:bg-white disabled:opacity-60 text-zinc-950 font-semibold text-sm flex items-center justify-center gap-2 transition-colors shadow-md"
                  >
                    <span>
                      {submitting
                        ? 'Enviando para o salão...'
                        : `Confirmar e Enviar para Mesa ${selectedTable ? formatTableNumber(selectedTable.number) : ''}`}
                    </span>
                  </button>
                </>
              )}
            </div>
          ) : (
            /* VISÃO 2: CONTA / COMANDA ATIVA DA MESA EM TEMPO REAL */
            <div className="space-y-4">
              {!activeTableOrder ? (
                <div className="py-10 text-center space-y-2 border border-dashed border-zinc-800 rounded-xl px-4">
                  <p className="text-sm text-zinc-300 font-medium">
                    Nenhuma comanda aberta na Mesa{' '}
                    {selectedTable
                      ? formatTableNumber(selectedTable.number)
                      : ''}
                  </p>
                  <p className="text-xs text-zinc-500">
                    Assim que você enviar seu primeiro pedido pela sacola, a comanda será aberta automaticamente!
                  </p>
                </div>
              ) : (
                <>
                  <div className="p-3.5 rounded-xl bg-[#16161a] border border-zinc-800/80 flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-base font-bold text-zinc-100">
                          Mesa{' '}
                          {selectedTable
                            ? formatTableNumber(selectedTable.number)
                            : ''}
                        </span>
                        <span className="text-xs text-zinc-400">
                          {formatOrderDisplayNumber(activeTableOrder.id)}
                        </span>
                      </div>
                      <p className="text-xs text-zinc-500 mt-0.5">
                        Aberto às {formatTimeHHMM(activeTableOrder.openedAt)} ·{' '}
                        {activeTableOrder.orderItems.reduce(
                          (acc, i) => acc + i.quantity,
                          0,
                        )}{' '}
                        itens pedidos
                      </p>
                    </div>
                    <span className="px-2.5 py-1 rounded-md text-[11px] font-semibold bg-amber-500/15 text-amber-400 border border-amber-500/30">
                      ABERTO
                    </span>
                  </div>

                  <div className="divide-y divide-zinc-800/80 max-h-72 overflow-y-auto pr-1">
                    {activeTableOrder.orderItems.map((item) => (
                      <div
                        key={item.id}
                        className="py-2.5 flex items-center justify-between gap-2 text-xs"
                      >
                        <div>
                          <p className="font-medium text-zinc-100 text-sm">
                            {item.quantity}x{' '}
                            {item.product?.name || `Produto #${item.productId}`}
                          </p>
                          <p className="text-zinc-500">
                            {formatCurrency(item.unitPrice)} cada
                          </p>
                          {item.notes && (
                            <p className="text-[11px] text-zinc-400 mt-0.5">
                              {item.notes}
                            </p>
                          )}
                        </div>
                        <span className="font-semibold text-zinc-100 text-sm">
                          {formatCurrency(
                            item.unitPrice * item.quantity,
                            false,
                          )}
                        </span>
                      </div>
                    ))}
                  </div>

                  <div className="pt-3 border-t border-zinc-800 space-y-1.5 text-xs">
                    <div className="flex justify-between text-zinc-400">
                      <span>Subtotal</span>
                      <span>{formatCurrency(tableSubtotal)}</span>
                    </div>
                    <div className="flex justify-between text-zinc-400">
                      <span>Taxa de serviço (10%)</span>
                      <span>{formatCurrency(tableServiceFee)}</span>
                    </div>
                    <div className="flex justify-between items-baseline pt-2 border-t border-zinc-800/80">
                      <span className="text-sm font-semibold text-zinc-100">
                        Total parcial da mesa
                      </span>
                      <span className="text-xl font-bold text-zinc-100">
                        {formatCurrency(tableTotal)}
                      </span>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}

