// Tipos centralizados para o sistema de pedidos

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

export interface OrderItem {
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
}

export interface Order {
  id: string;
  order_number: string;
  client_id: string;
  client_name: string;
  status: OrderStatus;
  total_amount: number;
  delivery_deadline?: string;
  seller?: string;
  seller_id?: string;
  seller_name?: string;
  payment_method?: string;
  payment_term?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
  user_id?: string;
  company_id?: string;
  order_items?: OrderItem[];
}

export interface OrderFormData {
  client_id: string;
  client_name: string;
  delivery_deadline?: Date | null;
  payment_method?: string;
  payment_term?: string;
  notes?: string;
  seller_id?: string;
  seller_name?: string;
  items: {
    product_id: string;
    product_name: string;
    quantity: number;
    unit_price: number;
  }[];
}

export interface OrderFilters {
  status?: OrderStatus;
  dateRange?: {
    start: Date;
    end: Date;
  };
  client?: string;
  seller?: string;
}

export interface OrderSortOptions {
  field: 'created_at' | 'order_number' | 'total_amount' | 'client_name';
  direction: 'asc' | 'desc';
}

// Utilitários para status
export const OrderStatusLabels: Record<OrderStatus, string> = {
  pending: 'Pendente',
  in_production: 'Em Produção',
  in_packaging: 'Em Embalagem',
  packaged: 'Embalado',
  released_for_sale: 'Liberado para Venda',
  sale_confirmed: 'Venda Confirmada',
  in_delivery: 'Em Entrega',
  delivered: 'Entregue',
  cancelled: 'Cancelado'
};

export const isOrderCompleted = (status: OrderStatus): boolean => {
  return ['delivered', 'cancelled'].includes(status);
};

export const isOrderInProgress = (status: OrderStatus): boolean => {
  return ['in_production', 'in_packaging', 'packaged', 'released_for_sale', 'sale_confirmed', 'in_delivery'].includes(status);
};

export const getOrderStatusColor = (status: OrderStatus): string => {
  const colors: Record<OrderStatus, string> = {
    pending: 'bg-yellow-100 text-yellow-800',
    in_production: 'bg-blue-100 text-blue-800',
    in_packaging: 'bg-purple-100 text-purple-800',
    packaged: 'bg-indigo-100 text-indigo-800',
    released_for_sale: 'bg-green-100 text-green-800',
    sale_confirmed: 'bg-emerald-100 text-emerald-800',
    in_delivery: 'bg-orange-100 text-orange-800',
    delivered: 'bg-gray-100 text-gray-800',
    cancelled: 'bg-red-100 text-red-800'
  };
  return colors[status];
};