// Re-exports centralizados para o sistema de pedidos
// DEPRECATED: Use useOrdersUnified instead for new code

// Tipos (migrados para /types/orders.ts)
export type {
  OrderStatus,
  Order,
  OrderItem,
  OrderFormData,
  OrderFilters,
  OrderSortOptions
} from '@/types/orders';

export {
  OrderStatusLabels,
  isOrderCompleted,
  isOrderInProgress,
  getOrderStatusColor
} from '@/types/orders';

// Hook principal (migrado para useOrdersUnified)
export { useOrdersUnified as useOrders } from './useOrdersUnified';

// Hooks específicos mantidos para compatibilidade
export { useOrdersCore } from "./orders/useOrdersCore";
export * from "./orders/useOrdersHelpers";