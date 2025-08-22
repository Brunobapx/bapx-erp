
import type { Order, OrderStatus } from "../useOrders";

// Função para traduzir status para português
export const translateStatus = (status: OrderStatus): string => {
  const statusTranslations: Record<OrderStatus, string> = {
    'pending': 'Pendente',
    'in_production': 'Em Produção',
    'in_packaging': 'Em Embalagem',
    'packaged': 'Embalado',
    'released_for_sale': 'Liberado para Venda',
    'sale_confirmed': 'Venda Confirmada',
    'in_delivery': 'Em Entrega',
    'delivered': 'Entregue',
    'cancelled': 'Cancelado'
  };
  return statusTranslations[status] || status;
};

export { formatCurrency } from '@/utils/formatCurrency';

export const isOrderCompleted = (status: OrderStatus) => {
  return ['delivered', 'cancelled'].includes(status);
};

export const getFirstOrderItem = (order: Order) => {
  return order.order_items?.[0] || null;
};
