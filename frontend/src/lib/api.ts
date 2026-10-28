import {
  AuthResponse,
  Order,
  Product,
  Reservation,
  Role,
  Table,
  User,
} from '@/types/restaurant';
import { getClientToken } from './auth-cookies';

export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';

const LOCAL_STATE_KEY = 'restaurante_mesa_synced_state_v1';
const SYNC_CHANNEL_NAME = 'restaurante_mesa_realtime_channel';

export interface RestaurantStateSnapshot {
  tables: Table[];
  products: Product[];
  reservations: Reservation[];
  orders: Order[];
  staff: User[];
}

/**
 * Estado inicial idêntico ao print de referência ("Restaurante Mesa"),
 * usado para seed rápido ou fallback caso o backend ainda não tenha sido populado.
 */
export const INITIAL_DEMO_STATE: RestaurantStateSnapshot = {
  tables: [
    { id: 1, number: 1, capacity: 2, status: 'AVAILABLE' },
    { id: 2, number: 2, capacity: 4, status: 'OCCUPIED' },
    { id: 3, number: 3, capacity: 4, status: 'RESERVED' },
    { id: 4, number: 4, capacity: 4, status: 'OCCUPIED' },
    { id: 5, number: 5, capacity: 6, status: 'AVAILABLE' },
    { id: 6, number: 6, capacity: 2, status: 'OCCUPIED' },
  ],
  products: [
    {
      id: 1,
      name: 'Água com gás',
      description: 'Garrafa 350ml naturalmente gaseificada com limão siciliano',
      price: 8.0,
      category: 'Bebida',
    },
    {
      id: 2,
      name: 'Limonada natural',
      description: 'Limões taiti e siciliano espremidos na hora com hortelã fresca',
      price: 16.0,
      category: 'Bebida',
    },
    {
      id: 3,
      name: 'Brownie de chocolate',
      description: 'Brownie meio amargo 70% cacau servido quente com calda artesanal',
      price: 26.0,
      category: 'Sobremesa',
    },
    {
      id: 4,
      name: 'Bife grelhado',
      description: 'Corte nobre de ancho grelhado na brasa com manteiga de ervas e batatas rústicas',
      price: 89.0,
      category: 'Prato principal',
    },
    {
      id: 5,
      name: 'Risoto de cogumelos',
      description: 'Arroz arbóreo cremoso com mix de cogumelos frescos e parmesão maturado',
      price: 64.0,
      category: 'Prato principal',
    },
    {
      id: 6,
      name: 'Bruschetta de tomate',
      description: 'Pão de fermentação natural tostado com tomates confit, alho assado e manjericão',
      price: 28.0,
      category: 'Entrada',
    },
  ],
  reservations: [
    {
      id: 1,
      customerName: 'Ana Martins',
      customerPhone: '(54) 99912-3456',
      dateTime: '2026-10-20T19:30:00.000Z',
      guestCount: 4,
      status: 'CONFIRMED',
      tableId: 3,
      table: { id: 3, number: 3, capacity: 4, status: 'RESERVED' },
    },
    {
      id: 2,
      customerName: 'Bruno Costa',
      customerPhone: '(54) 99988-7766',
      dateTime: '2026-10-20T20:00:00.000Z',
      guestCount: 2,
      status: 'CONFIRMED',
      tableId: 1,
      table: { id: 1, number: 1, capacity: 2, status: 'AVAILABLE' },
    },
  ],
  orders: [
    {
      id: 1040,
      openedAt: '2026-10-20T18:25:00.000Z',
      status: 'OPEN',
      totalAmount: 92.0,
      tableId: 2,
      userId: 2,
      table: { id: 2, number: 2, capacity: 4, status: 'OCCUPIED' },
      user: { id: 2, name: 'Garçom João', role: 'WAITER' },
      orderItems: [
        {
          id: 101,
          orderId: 1040,
          productId: 5,
          quantity: 1,
          unitPrice: 64.0,
          product: {
            id: 5,
            name: 'Risoto de cogumelos',
            price: 64.0,
            category: 'Prato principal',
          },
        },
        {
          id: 102,
          orderId: 1040,
          productId: 6,
          quantity: 1,
          unitPrice: 28.0,
          product: {
            id: 6,
            name: 'Bruschetta de tomate',
            price: 28.0,
            category: 'Entrada',
          },
        },
      ],
    },
    {
      id: 1042,
      openedAt: '2026-10-20T18:40:00.000Z',
      status: 'OPEN',
      totalAmount: 284.0,
      tableId: 4,
      userId: 1,
      table: { id: 4, number: 4, capacity: 4, status: 'OCCUPIED' },
      user: { id: 1, name: 'Administrador Geral', role: 'ADMIN' },
      orderItems: [
        {
          id: 201,
          orderId: 1042,
          productId: 4,
          quantity: 2,
          unitPrice: 89.0,
          product: {
            id: 4,
            name: 'Bife grelhado',
            price: 89.0,
            category: 'Prato principal',
          },
        },
        {
          id: 202,
          orderId: 1042,
          productId: 5,
          quantity: 1,
          unitPrice: 64.0,
          product: {
            id: 5,
            name: 'Risoto de cogumelos',
            price: 64.0,
            category: 'Prato principal',
          },
        },
        {
          id: 203,
          orderId: 1042,
          productId: 1,
          quantity: 2,
          unitPrice: 8.0,
          product: {
            id: 1,
            name: 'Água com gás',
            price: 8.0,
            category: 'Bebida',
          },
        },
        {
          id: 204,
          orderId: 1042,
          productId: 3,
          quantity: 1,
          unitPrice: 26.0,
          product: {
            id: 3,
            name: 'Brownie de chocolate',
            price: 26.0,
            category: 'Sobremesa',
          },
        },
      ],
    },
    {
      id: 1043,
      openedAt: '2026-10-20T18:55:00.000Z',
      status: 'OPEN',
      totalAmount: 42.0,
      tableId: 6,
      userId: 2,
      table: { id: 6, number: 6, capacity: 2, status: 'OCCUPIED' },
      user: { id: 2, name: 'Garçom João', role: 'WAITER' },
      orderItems: [
        {
          id: 301,
          orderId: 1043,
          productId: 2,
          quantity: 1,
          unitPrice: 16.0,
          product: {
            id: 2,
            name: 'Limonada natural',
            price: 16.0,
            category: 'Bebida',
          },
        },
        {
          id: 302,
          orderId: 1043,
          productId: 3,
          quantity: 1,
          unitPrice: 26.0,
          product: {
            id: 3,
            name: 'Brownie de chocolate',
            price: 26.0,
            category: 'Sobremesa',
          },
        },
      ],
    },
  ],
  staff: [
    {
      id: 1,
      name: 'Administrador Geral',
      email: 'admin@restaurant.com',
      role: 'ADMIN',
    },
    {
      id: 2,
      name: 'Garçom João',
      email: 'waiter@restaurant.com',
      role: 'WAITER',
    },
  ],
};

/**
 * Dispara evento em tempo real entre abas (ex: quando um cliente faz um pedido em /cardapio,
 * a aba /atendimento atualiza imediatamente).
 */
export function notifyRealtimeSync(reason: string, tableNumber?: number) {
  if (typeof window === 'undefined') return;
  try {
    const bc = new BroadcastChannel(SYNC_CHANNEL_NAME);
    bc.postMessage({ reason, tableNumber, timestamp: Date.now() });
    bc.close();
  } catch {
    // Fallback via evento de storage
  }
  localStorage.setItem(
    'restaurante_mesa_last_event',
    JSON.stringify({ reason, tableNumber, timestamp: Date.now() }),
  );
}

export function subscribeRealtimeSync(
  callback: (payload: { reason: string; tableNumber?: number }) => void,
): () => void {
  if (typeof window === 'undefined') return () => {};

  let bc: BroadcastChannel | null = null;
  try {
    bc = new BroadcastChannel(SYNC_CHANNEL_NAME);
    bc.onmessage = (event) => {
      if (event.data) callback(event.data);
    };
  } catch {
    bc = null;
  }

  const onStorage = (e: StorageEvent) => {
    if (e.key === 'restaurante_mesa_last_event' && e.newValue) {
      try {
        callback(JSON.parse(e.newValue));
      } catch {
        // Ignora JSON inválido
      }
    }
  };
  window.addEventListener('storage', onStorage);

  return () => {
    if (bc) bc.close();
    window.removeEventListener('storage', onStorage);
  };
}

export function getLocalSnapshot(): RestaurantStateSnapshot {
  if (typeof window === 'undefined') return INITIAL_DEMO_STATE;
  try {
    const raw = localStorage.getItem(LOCAL_STATE_KEY);
    if (!raw) {
      localStorage.setItem(LOCAL_STATE_KEY, JSON.stringify(INITIAL_DEMO_STATE));
      return INITIAL_DEMO_STATE;
    }
    return JSON.parse(raw) as RestaurantStateSnapshot;
  } catch {
    return INITIAL_DEMO_STATE;
  }
}

export function saveLocalSnapshot(state: RestaurantStateSnapshot) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(LOCAL_STATE_KEY, JSON.stringify(state));
}

async function apiFetch<T>(
  endpoint: string,
  options: RequestInit = {},
): Promise<T> {
  const token = getClientToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const errBody = await response.json().catch(() => ({}));
    const msg = Array.isArray(errBody?.message)
      ? errBody.message.join(', ')
      : errBody?.message || `Erro HTTP ${response.status}`;
    throw new Error(msg);
  }

  return response.json() as Promise<T>;
}

/**
 * 1. Autenticação (Login e Cadastro de Funcionários)
 */
export async function loginApi(
  email: string,
  password: string,
): Promise<AuthResponse> {
  try {
    return await apiFetch<AuthResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  } catch (err) {
    // Caso o backend NestJS esteja desligado no momento do teste, permite login com as credenciais padrão do seed
    const isNetworkError =
      err instanceof TypeError ||
      (err instanceof Error && err.message.includes('Failed to fetch'));

    if (isNetworkError) {
      const state = getLocalSnapshot();
      const foundUser = state.staff.find(
        (u) => u.email.toLowerCase() === email.toLowerCase(),
      );
      if (foundUser && password === 'admin123') {
        return {
          access_token: `demo-jwt-token-${foundUser.id}-${Date.now()}`,
          user: foundUser,
        };
      }
    }
    throw err;
  }
}

export async function registerStaffApi(dto: {
  name: string;
  email: string;
  password: string;
  role: Role;
}): Promise<User> {
  try {
    const created = await apiFetch<User>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(dto),
    });
    notifyRealtimeSync('staff_registered');
    return created;
  } catch (err) {
    const isNetworkError =
      err instanceof TypeError ||
      (err instanceof Error && err.message.includes('Failed to fetch'));
    if (isNetworkError) {
      const state = getLocalSnapshot();
      const newUser: User = {
        id: Date.now(),
        name: dto.name,
        email: dto.email,
        role: dto.role,
        createdAt: new Date().toISOString(),
      };
      state.staff.push(newUser);
      saveLocalSnapshot(state);
      notifyRealtimeSync('staff_registered');
      return newUser;
    }
    throw err;
  }
}

/**
 * 2. Carregamento completo do Dashboard de Gestão (Mesas, Produtos, Reservas, Pedidos)
 */
export async function fetchDashboardData(): Promise<{
  snapshot: RestaurantStateSnapshot;
  isLiveBackend: boolean;
}> {
  try {
    const [tables, products, reservations, orders, staff] = await Promise.all([
      apiFetch<Table[]>('/tables'),
      apiFetch<Product[]>('/products'),
      apiFetch<Reservation[]>('/reservations'),
      apiFetch<Order[]>('/orders'),
      apiFetch<User[]>('/auth/staff').catch(() => INITIAL_DEMO_STATE.staff),
    ]);

    const snapshot: RestaurantStateSnapshot = {
      tables,
      products,
      reservations,
      orders,
      staff,
    };
    saveLocalSnapshot(snapshot);
    return { snapshot, isLiveBackend: true };
  } catch {
    return { snapshot: getLocalSnapshot(), isLiveBackend: false };
  }
}

/**
 * 3. Mesas
 */
export async function createTableApi(dto: {
  number: number;
  capacity: number;
}): Promise<Table> {
  try {
    const table = await apiFetch<Table>('/tables', {
      method: 'POST',
      body: JSON.stringify(dto),
    });
    notifyRealtimeSync('table_created', table.number);
    return table;
  } catch (err) {
    const isNetworkError =
      err instanceof TypeError ||
      (err instanceof Error && err.message.includes('Failed to fetch'));
    if (isNetworkError) {
      const state = getLocalSnapshot();
      if (state.tables.some((t) => t.number === dto.number)) {
        throw new Error(`A mesa número ${dto.number} já está cadastrada`);
      }
      const newTable: Table = {
        id: Math.max(0, ...state.tables.map((t) => t.id)) + 1,
        number: dto.number,
        capacity: dto.capacity,
        status: 'AVAILABLE',
      };
      state.tables.push(newTable);
      state.tables.sort((a, b) => a.number - b.number);
      saveLocalSnapshot(state);
      notifyRealtimeSync('table_created', newTable.number);
      return newTable;
    }
    throw err;
  }
}

/**
 * 4. Produtos
 */
export async function createProductApi(dto: {
  name: string;
  description?: string;
  price: number;
  category: string;
}): Promise<Product> {
  try {
    const product = await apiFetch<Product>('/products', {
      method: 'POST',
      body: JSON.stringify(dto),
    });
    notifyRealtimeSync('product_created');
    return product;
  } catch (err) {
    const isNetworkError =
      err instanceof TypeError ||
      (err instanceof Error && err.message.includes('Failed to fetch'));
    if (isNetworkError) {
      const state = getLocalSnapshot();
      const newProduct: Product = {
        id: Math.max(0, ...state.products.map((p) => p.id)) + 1,
        name: dto.name,
        description: dto.description || '',
        price: Number(dto.price),
        category: dto.category,
      };
      state.products.push(newProduct);
      saveLocalSnapshot(state);
      notifyRealtimeSync('product_created');
      return newProduct;
    }
    throw err;
  }
}

export async function deleteProductApi(id: number): Promise<void> {
  try {
    await apiFetch(`/products/${id}`, { method: 'DELETE' });
    notifyRealtimeSync('product_deleted');
  } catch (err) {
    const isNetworkError =
      err instanceof TypeError ||
      (err instanceof Error && err.message.includes('Failed to fetch'));
    if (isNetworkError) {
      const state = getLocalSnapshot();
      state.products = state.products.filter((p) => p.id !== id);
      saveLocalSnapshot(state);
      notifyRealtimeSync('product_deleted');
      return;
    }
    throw err;
  }
}

/**
 * 5. Reservas
 */
export async function createReservationApi(dto: {
  customerName: string;
  customerPhone: string;
  dateTime: string;
  guestCount: number;
  tableId?: number;
}): Promise<Reservation> {
  try {
    const reservation = await apiFetch<Reservation>('/reservations', {
      method: 'POST',
      body: JSON.stringify(dto),
    });
    notifyRealtimeSync('reservation_created');
    return reservation;
  } catch (err) {
    const isNetworkError =
      err instanceof TypeError ||
      (err instanceof Error && err.message.includes('Failed to fetch'));
    if (isNetworkError) {
      const state = getLocalSnapshot();
      const targetTable = dto.tableId
        ? state.tables.find((t) => t.id === dto.tableId) ?? null
        : null;
      if (targetTable && targetTable.status === 'AVAILABLE') {
        targetTable.status = 'RESERVED';
      }
      const newRes: Reservation = {
        id: Math.max(0, ...state.reservations.map((r) => r.id)) + 1,
        customerName: dto.customerName,
        customerPhone: dto.customerPhone,
        dateTime: dto.dateTime,
        guestCount: dto.guestCount,
        status: 'CONFIRMED',
        tableId: dto.tableId ?? null,
        table: targetTable,
      };
      state.reservations.push(newRes);
      saveLocalSnapshot(state);
      notifyRealtimeSync('reservation_created');
      return newRes;
    }
    throw err;
  }
}

/**
 * 6. Pedidos / Comandas (Abertura, Adição de Item, Quantidade, Remoção, Transferência e Fechamento)
 */
export async function openOrderApi(
  tableId: number,
  userId: number,
): Promise<Order> {
  try {
    const created = await apiFetch<Order>('/orders', {
      method: 'POST',
      body: JSON.stringify({ tableId, userId }),
    });
    notifyRealtimeSync('order_opened');
    return created;
  } catch (err) {
    const isNetworkError =
      err instanceof TypeError ||
      (err instanceof Error && err.message.includes('Failed to fetch'));
    if (isNetworkError) {
      const state = getLocalSnapshot();
      const table = state.tables.find((t) => t.id === tableId);
      if (!table) throw new Error('Mesa não encontrada');
      table.status = 'OCCUPIED';

      const newOrder: Order = {
        id: Math.max(1043, ...state.orders.map((o) => o.id)) + 1,
        openedAt: new Date().toISOString(),
        status: 'OPEN',
        totalAmount: 0,
        tableId,
        userId,
        table,
        user: state.staff.find((u) => u.id === userId) || state.staff[0],
        orderItems: [],
      };
      state.orders.unshift(newOrder);
      saveLocalSnapshot(state);
      notifyRealtimeSync('order_opened', table.number);
      return newOrder;
    }
    throw err;
  }
}

export async function addOrderItemApi(
  orderId: number,
  dto: { productId: number; quantity: number; notes?: string },
): Promise<void> {
  try {
    await apiFetch(`/orders/${orderId}/items`, {
      method: 'POST',
      body: JSON.stringify(dto),
    });
    notifyRealtimeSync('order_updated');
  } catch (err) {
    const isNetworkError =
      err instanceof TypeError ||
      (err instanceof Error && err.message.includes('Failed to fetch'));
    if (isNetworkError) {
      const state = getLocalSnapshot();
      const order = state.orders.find((o) => o.id === orderId);
      const product = state.products.find((p) => p.id === dto.productId);
      if (!order || !product) throw new Error('Pedido ou produto não encontrado');

      const existing = order.orderItems.find(
        (i) => i.productId === dto.productId && (i.notes || '') === (dto.notes || ''),
      );
      if (existing) {
        existing.quantity += dto.quantity;
      } else {
        order.orderItems.push({
          id: Date.now() + Math.floor(Math.random() * 1000),
          orderId,
          productId: product.id,
          quantity: dto.quantity,
          notes: dto.notes,
          unitPrice: product.price,
          product,
        });
      }
      order.totalAmount = order.orderItems.reduce(
        (acc, item) => acc + item.unitPrice * item.quantity,
        0,
      );
      saveLocalSnapshot(state);
      notifyRealtimeSync('order_updated');
      return;
    }
    throw err;
  }
}

export async function updateOrderItemQuantityApi(
  orderId: number,
  itemId: number,
  quantity: number,
): Promise<void> {
  try {
    await apiFetch(`/orders/${orderId}/items/${itemId}`, {
      method: 'PATCH',
      body: JSON.stringify({ quantity }),
    });
    notifyRealtimeSync('order_updated');
  } catch {
    const state = getLocalSnapshot();
    const order = state.orders.find((o) => o.id === orderId);
    if (!order) return;
    if (quantity <= 0) {
      order.orderItems = order.orderItems.filter((i) => i.id !== itemId);
    } else {
      const item = order.orderItems.find((i) => i.id === itemId);
      if (item) item.quantity = quantity;
    }
    order.totalAmount = order.orderItems.reduce(
      (acc, item) => acc + item.unitPrice * item.quantity,
      0,
    );
    saveLocalSnapshot(state);
    notifyRealtimeSync('order_updated');
  }
}

export async function removeOrderItemApi(
  orderId: number,
  itemId: number,
): Promise<void> {
  try {
    await apiFetch(`/orders/${orderId}/items/${itemId}`, {
      method: 'DELETE',
    });
    notifyRealtimeSync('order_updated');
  } catch {
    const state = getLocalSnapshot();
    const order = state.orders.find((o) => o.id === orderId);
    if (!order) return;
    order.orderItems = order.orderItems.filter((i) => i.id !== itemId);
    order.totalAmount = order.orderItems.reduce(
      (acc, item) => acc + item.unitPrice * item.quantity,
      0,
    );
    saveLocalSnapshot(state);
    notifyRealtimeSync('order_updated');
  }
}

export async function closeOrderApi(orderId: number): Promise<void> {
  try {
    await apiFetch(`/orders/${orderId}/close`, {
      method: 'PATCH',
    });
    notifyRealtimeSync('order_closed');
  } catch {
    const state = getLocalSnapshot();
    const order = state.orders.find((o) => o.id === orderId);
    if (!order) return;
    order.status = 'CLOSED';
    const table = state.tables.find((t) => t.id === order.tableId);
    if (table) table.status = 'AVAILABLE';
    saveLocalSnapshot(state);
    notifyRealtimeSync('order_closed');
  }
}

export async function transferOrderApi(
  orderId: number,
  targetTableId: number,
): Promise<void> {
  try {
    await apiFetch(`/orders/${orderId}/transfer`, {
      method: 'PATCH',
      body: JSON.stringify({ targetTableId }),
    });
    notifyRealtimeSync('order_transferred');
  } catch {
    const state = getLocalSnapshot();
    const order = state.orders.find((o) => o.id === orderId);
    const targetTable = state.tables.find((t) => t.id === targetTableId);
    if (!order || !targetTable) return;
    const oldTable = state.tables.find((t) => t.id === order.tableId);
    if (oldTable) oldTable.status = 'AVAILABLE';
    targetTable.status = 'OCCUPIED';
    order.tableId = targetTable.id;
    order.table = targetTable;
    saveLocalSnapshot(state);
    notifyRealtimeSync('order_transferred', targetTable.number);
  }
}

/**
 * 7. Cardápio Digital do Cliente (Área Pública integrada com o Sistema de Gestão)
 */
export async function fetchPublicCustomerMenu(): Promise<{
  products: Product[];
  tables: Table[];
  openOrders: Order[];
  isLiveBackend: boolean;
}> {
  try {
    const res = await fetch(`${API_BASE_URL}/public/menu`, {
      cache: 'no-store',
    });
    if (!res.ok) throw new Error('Falha ao buscar menu público');
    const data = await res.json();
    return {
      products: data.products ?? [],
      tables: data.tables ?? [],
      openOrders: data.openOrders ?? [],
      isLiveBackend: true,
    };
  } catch {
    const snap = getLocalSnapshot();
    return {
      products: snap.products,
      tables: snap.tables,
      openOrders: snap.orders.filter((o) => o.status === 'OPEN'),
      isLiveBackend: false,
    };
  }
}

export async function submitCustomerMenuOrder(payload: {
  tableId: number;
  customerName?: string;
  items: Array<{ productId: number; quantity: number; notes?: string }>;
}): Promise<Order> {
  try {
    const res = await fetch(`${API_BASE_URL}/public/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err?.message || 'Erro ao enviar pedido');
    }
    const order = (await res.json()) as Order;
    const tableNum = order.table?.number;
    notifyRealtimeSync('customer_order_submitted', tableNum);
    return order;
  } catch (err) {
    const isNetworkError =
      err instanceof TypeError ||
      (err instanceof Error && err.message.includes('Failed to fetch'));
    if (isNetworkError) {
      const state = getLocalSnapshot();
      const table = state.tables.find((t) => t.id === payload.tableId);
      if (!table) throw new Error('Mesa selecionada não encontrada');

      let order = state.orders.find(
        (o) => o.tableId === payload.tableId && o.status === 'OPEN',
      );
      if (!order) {
        table.status = 'OCCUPIED';
        order = {
          id: Math.max(1043, ...state.orders.map((o) => o.id)) + 1,
          openedAt: new Date().toISOString(),
          status: 'OPEN',
          totalAmount: 0,
          tableId: table.id,
          userId: 1,
          table,
          user: state.staff[0],
          orderItems: [],
        };
        state.orders.unshift(order);
      }

      for (const item of payload.items) {
        const product = state.products.find((p) => p.id === item.productId);
        if (!product || item.quantity <= 0) continue;

        const prefix = payload.customerName
          ? `[Cliente: ${payload.customerName}]`
          : '[Cardápio Digital]';
        const finalNotes = item.notes ? `${prefix} ${item.notes}` : prefix;

        order.orderItems.push({
          id: Date.now() + Math.floor(Math.random() * 10000),
          orderId: order.id,
          productId: product.id,
          quantity: item.quantity,
          notes: finalNotes,
          unitPrice: product.price,
          product,
        });
      }

      order.totalAmount = order.orderItems.reduce(
        (acc, i) => acc + i.unitPrice * i.quantity,
        0,
      );
      saveLocalSnapshot(state);
      notifyRealtimeSync('customer_order_submitted', table.number);
      return order;
    }
    throw err;
  }
}

