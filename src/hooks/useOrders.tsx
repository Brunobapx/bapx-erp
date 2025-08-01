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
  seller_id?: string;
  seller_name?: string;
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

// Sub-hooks importados
export { useOrdersCore as useOrders } from "./orders/useOrdersCore";
export * from "./orders/useOrdersHelpers";