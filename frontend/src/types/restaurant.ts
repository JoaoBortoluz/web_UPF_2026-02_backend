export type Role = 'ADMIN' | 'MANAGER' | 'WAITER' | 'RECEPTIONIST';

export type TableStatus = 'AVAILABLE' | 'OCCUPIED' | 'RESERVED';

export type ReservationStatus = 'PENDING' | 'CONFIRMED' | 'CANCELLED';

export type OrderStatus = 'OPEN' | 'CLOSED' | 'CANCELLED';

export interface User {
  id: number;
  name: string;
  email: string;
  role: Role;
  createdAt?: string;
}

export interface AuthResponse {
  access_token: string;
  user: User;
}

export interface Table {
  id: number;
  number: number;
  capacity: number;
  status: TableStatus;
  createdAt?: string;
  updatedAt?: string;
}

export interface Product {
  id: number;
  name: string;
  description?: string | null;
  price: number;
  category: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Reservation {
  id: number;
  customerName: string;
  customerPhone: string;
  dateTime: string;
  guestCount: number;
  status: ReservationStatus;
  tableId?: number | null;
  table?: Table | null;
  createdAt?: string;
}

export interface OrderItem {
  id: number;
  quantity: number;
  notes?: string | null;
  unitPrice: number;
  orderId: number;
  productId: number;
  product?: Product;
}

export interface Order {
  id: number;
  openedAt: string;
  status: OrderStatus;
  totalAmount: number;
  tableId: number;
  userId: number;
  table?: Table;
  user?: Pick<User, 'id' | 'name' | 'role'>;
  orderItems: OrderItem[];
}

export interface CustomerCartItem {
  product: Product;
  quantity: number;
  notes: string;
}

