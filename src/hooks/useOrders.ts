// DEPRECATED: Este arquivo será removido em futuras versões
// Use useOrdersUnified ou importe diretamente de useOrders.tsx

export type {
  OrderStatus,
  Order,
  OrderItem,
  OrderFormData
} from '@/types/orders';

export {
  OrderStatusLabels,
  isOrderCompleted,
  isOrderInProgress,
  getOrderStatusColor
} from '@/types/orders';

// Re-export do hook unificado para compatibilidade
export { useOrdersUnified as useOrders } from './useOrdersUnified';
