
// Tipos
export type OrderStatus = 
  | 'pending'
  | 'in_production'
  | 'in_packaging'
  | 'packaged'
  | 'released_for_sale'
  | 'sale_confirmed'
  | 'in_delivery'
  | 'delivered'
  | 'cancelled';

export type Order = {
  id: string;
  order_number: string;
  client_id: string;
  client_name: string;
  seller?: string;
  status: OrderStatus;
  total_amount: number;
  delivery_deadline?: string;
  payment_method?: string;
  payment_term?: string;
  notes?: string;
  created_at?: string;
  updated_at?: string;
  user_id?: string;
  company_id?: string;
  order_items?: OrderItem[];
};

export type OrderItem = {
  id: string;
  order_id: string;
  product_id: string;
  product_name: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  created_at?: string;
  updated_at?: string;
  user_id?: string;
  company_id?: string;
};

// DEPRECATED: Usar useOrders.ts diretamente
// @deprecated Use import { useOrders } from '@/hooks/useOrders' instead
export { useOrders } from "./useOrders";
export * from "./useOrders";
