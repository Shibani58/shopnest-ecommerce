// Shapes of the JSON returned by the Spring Boot API.

export type Role = 'CUSTOMER' | 'ADMIN';
export type OrderStatus = 'PLACED' | 'CONFIRMED' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED';
export type PaymentMethod = 'CASH_ON_DELIVERY' | 'CARD';

export interface User {
  id: number;
  fullName: string;
  email: string;
  role: Role;
}

export interface AuthResponse {
  token: string;
  expiresInMs: number;
  user: User;
}

export interface Page<T> {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  last: boolean;
}

export interface Category {
  id: number;
  name: string;
  description: string | null;
}

export interface Product {
  id: number;
  name: string;
  description: string | null;
  price: number;
  discountPercent: number;
  sellingPrice: number;
  stock: number;
  imageUrl: string | null;
  categoryId: number;
  categoryName: string;
  averageRating: number;
  reviewCount: number;
  active: boolean;
  createdAt: string;
}

export interface ProductInput {
  name: string;
  description: string | null;
  price: number;
  discountPercent: number;
  stock: number;
  imageUrl: string | null;
  categoryId: number;
  active: boolean;
}

export interface Review {
  id: number;
  rating: number;
  comment: string | null;
  reviewerId: number;
  reviewerName: string;
  verifiedPurchase: boolean;
  createdAt: string;
}

export interface CartItem {
  productId: number;
  name: string;
  imageUrl: string | null;
  unitPrice: number;
  quantity: number;
  lineTotal: number;
  stock: number;
}

export interface Cart {
  items: CartItem[];
  itemCount: number;
  subtotal: number;
  shippingFee: number;
  total: number;
}

export interface Address {
  recipientName: string;
  phone: string;
  line1: string;
  line2: string | null;
  city: string;
  state: string;
  postalCode: string;
  country: string;
}

export interface CheckoutRequest {
  shippingAddress: Address;
  paymentMethod: PaymentMethod;
  card: { number: string; expiry: string; cvv: string } | null;
}

export interface OrderItem {
  productId: number | null;
  productName: string;
  imageUrl: string | null;
  unitPrice: number;
  quantity: number;
  lineTotal: number;
}

export interface Order {
  id: number;
  status: OrderStatus;
  paymentMethod: PaymentMethod;
  paymentReference: string | null;
  items: OrderItem[];
  subtotal: number;
  shippingFee: number;
  total: number;
  shippingAddress: Address;
  customerName: string;
  customerEmail: string;
  createdAt: string;
  updatedAt: string;
}

export interface Dashboard {
  totalRevenue: number;
  totalOrders: number;
  activeProducts: number;
  customers: number;
  ordersByStatus: Record<string, number>;
  productsByCategory: Record<string, number>;
  recentOrders: Order[];
  lowStockProducts: Product[];
}

export interface ProductQuery {
  q?: string;
  categoryId?: number | null;
  minPrice?: number | null;
  maxPrice?: number | null;
  inStock?: boolean;
  sort?: string;
  page?: number;
  size?: number;
}

/** Mirrors OrderStatus.canMoveTo on the server. */
export const NEXT_STATUSES: Record<OrderStatus, OrderStatus[]> = {
  PLACED: ['CONFIRMED', 'CANCELLED'],
  CONFIRMED: ['SHIPPED', 'CANCELLED'],
  SHIPPED: ['DELIVERED'],
  DELIVERED: [],
  CANCELLED: [],
};
