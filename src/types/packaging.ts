// Tipos centralizados para o sistema de embalagem

export type PackagingStatus = 
  | 'pending'
  | 'in_progress'
  | 'completed'
  | 'approved'
  | 'rejected';

export type PackagingOrigin = 'stock' | 'production' | 'mixed';

export interface PackagingItem {
  id: string;
  packaging_number: string;
  order_id?: string;
  order_number?: string;
  client_id?: string;
  client_name?: string;
  product_id: string;
  product_name: string;
  quantity_to_package: number;
  quantity_packaged: number;
  quantity_from_stock: number;
  quantity_from_production: number;
  status: PackagingStatus;
  origin: PackagingOrigin;
  packaged_at?: string;
  approved_at?: string;
  packaged_by?: string;
  approved_by?: string;
  quality_check: boolean;
  notes?: string;
  created_at: string;
  updated_at: string;
  user_id: string;
  production_id?: string;
  tracking_id?: string;
}

export interface PackagingFormData {
  product_id: string;
  product_name: string;
  quantity_to_package: number;
  notes?: string;
  order_id?: string;
  client_id?: string;
  client_name?: string;
  production_id?: string;
}

export interface PackagingFilters {
  status?: PackagingStatus;
  origin?: PackagingOrigin | 'all';
  product?: string;
  order?: string;
  dateRange?: {
    start: Date;
    end: Date;
  };
}

export interface PackagingSortOptions {
  field: 'created_at' | 'packaging_number' | 'quantity_to_package' | 'product_name';
  direction: 'asc' | 'desc';
}

// Utilitários para status
export const PackagingStatusLabels: Record<PackagingStatus, string> = {
  pending: 'Pendente',
  in_progress: 'Em Andamento',
  completed: 'Concluída',
  approved: 'Aprovada',
  rejected: 'Rejeitada'
};

export const PackagingOriginLabels: Record<PackagingOrigin, string> = {
  stock: 'Estoque',
  production: 'Produção',
  mixed: 'Misto'
};

export const isPackagingCompleted = (status: PackagingStatus): boolean => {
  return ['approved', 'rejected'].includes(status);
};

export const isPackagingInProgress = (status: PackagingStatus): boolean => {
  return ['in_progress', 'completed'].includes(status);
};

export const getPackagingStatusColor = (status: PackagingStatus): string => {
  const colors: Record<PackagingStatus, string> = {
    pending: 'bg-yellow-100 text-yellow-800',
    in_progress: 'bg-blue-100 text-blue-800',
    completed: 'bg-purple-100 text-purple-800',
    approved: 'bg-green-100 text-green-800',
    rejected: 'bg-red-100 text-red-800'
  };
  return colors[status];
};

export const getPackagingOriginColor = (origin: PackagingOrigin): string => {
  const colors: Record<PackagingOrigin, string> = {
    stock: 'bg-gray-100 text-gray-800',
    production: 'bg-blue-100 text-blue-800',
    mixed: 'bg-purple-100 text-purple-800'
  };
  return colors[origin];
};

// Tipos legados para compatibilidade (DEPRECATED)
export type Packaging = PackagingItem;
export type PackagingFlowStatus = PackagingStatus;
export type PackagingFlowItem = PackagingItem;