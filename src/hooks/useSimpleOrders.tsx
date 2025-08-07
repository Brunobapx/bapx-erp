// REFATORADO: Agora usa useOrdersUnified para reduzir duplicação
import { useOrdersUnified } from './useOrdersUnified';
import type { Order, OrderItem, OrderFormData } from '@/types/orders';

// Tipos mantidos para compatibilidade (deprecated - use types/orders.ts)
export interface SimpleOrder extends Order {}
export interface SimpleOrderItem extends OrderItem {}  
export interface SimpleOrderFormData extends OrderFormData {}

export const useSimpleOrders = () => {
  // Usar o hook unificado com configurações específicas para "simple orders"
  const ordersHook = useOrdersUnified({
    autoRefresh: true,
    sorting: { field: 'created_at', direction: 'desc' }
  });

  return {
    // Manter interface original para compatibilidade
    orders: ordersHook.orders,
    loading: ordersHook.loading,
    submitting: ordersHook.submitting,
    loadOrders: ordersHook.loadOrders,
    createOrder: ordersHook.createOrder,
    
    // Novos métodos do hook unificado também disponíveis
    ...ordersHook
  };
};