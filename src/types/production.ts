
// Tipos centralizados para o sistema de produção

export type ProductionStatus = 
  | 'pending'
  | 'in_progress' 
  | 'completed'
  | 'approved'
  | 'rejected';

export interface ProductionItem {
  id: string;
  production_number: string;
  order_id?: string;
  order_number?: string;
  order_item_id?: string;
  product_id: string;
  product_name: string;
  client_id?: string;
  client_name?: string;
  quantity_requested: number;
  quantity_produced: number;
  status: ProductionStatus;
  start_date?: string;
  completion_date?: string;
  approved_at?: string;
  approved_by?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
  user_id: string;
  tracking_id?: string;
  production_type: 'order' | 'internal';
}

export interface InternalProductionItem extends Omit<ProductionItem, 'order_id' | 'order_number' | 'order_item_id' | 'client_id' | 'client_name'> {
  production_type: 'internal';
}

export interface OrderProductionItem extends ProductionItem {
  order_id: string;
  order_number: string;
  order_item_id: string;
  client_id: string;
  client_name: string;
  production_type: 'order';
}

export interface ProductionFormData {
  product_id: string;
  product_name: string;
  quantity_requested: number;
  notes?: string;
  order_item_id?: string; // Para produções de pedidos
}

export interface ProductionFilters {
  status?: ProductionStatus;
  production_type?: 'order' | 'internal' | 'all';
  product?: string;
  dateRange?: {
    start: Date;
    end: Date;
  };
}

export interface ProductionSortOptions {
  field: 'created_at' | 'production_number' | 'quantity_requested' | 'product_name';
  direction: 'asc' | 'desc';
}

// Utilitários para status
export const ProductionStatusLabels: Record<ProductionStatus, string> = {
  pending: 'Pendente',
  in_progress: 'Em Andamento',
  completed: 'Concluída',
  approved: 'Aprovada',
  rejected: 'Rejeitada'
};

export const isProductionCompleted = (status: ProductionStatus): boolean => {
  return ['approved', 'rejected'].includes(status);
};

export const isProductionInProgress = (status: ProductionStatus): boolean => {
  return ['in_progress', 'completed'].includes(status);
};

export const getProductionStatusColor = (status: ProductionStatus): string => {
  const colors: Record<ProductionStatus, string> = {
    pending: 'bg-yellow-100 text-yellow-800',
    in_progress: 'bg-blue-100 text-blue-800',
    completed: 'bg-purple-100 text-purple-800',
    approved: 'bg-green-100 text-green-800',
    rejected: 'bg-red-100 text-red-800'
  };
  return colors[status];
};

// Tipos legados para compatibilidade (DEPRECATED)
export type Production = Partial<ProductionItem> & {
  id: string;
  production_number: string;
  product_id: string;
  product_name: string;
  quantity_requested: number;
  quantity_produced: number;
  status: ProductionStatus;
};
export type ProductionFlowStatus = ProductionStatus;
export type ProductionFlowItem = OrderProductionItem;

export type ProductionSummary = {
  product_id: string;
  product_name: string;
  total_quantity: number;
  orders_count: number;
  production_items: {
    production_number: string;
    quantity: number;
    status: string;
    order_number: string;
    client_name: string;
  }[];
};

export type AlertType = {
  id: string;
  type: 'order' | 'production' | 'packaging' | 'sales' | 'finance' | 'route';
  message: string;
  time: string;
};
