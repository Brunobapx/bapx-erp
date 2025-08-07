
export type ProductionStatus = 
  | 'pending'
  | 'in_progress'
  | 'completed'
  | 'approved'
  | 'rejected';

export type Production = {
  id: string;
  production_number: string;
  order_item_id: string;
  product_id: string;
  product_name: string;
  quantity_requested: number;
  quantity_produced: number;
  status: ProductionStatus;
  start_date?: string;
  completion_date?: string;
  approved_by?: string;
  approved_at?: string;
  notes?: string;
  created_at?: string;
  updated_at?: string;
  user_id?: string;
  order_number?: string;
  client_name?: string;
};

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
