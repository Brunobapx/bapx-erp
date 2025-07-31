
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from "sonner";
import { useAuth } from '@/components/Auth/AuthProvider';
import { 
  Order, OrderStatus, OrderItem
} from '../useOrders';

export const useOrdersCore = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const { user, userRole } = useAuth();

  const loadOrders = useCallback(async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      console.log('[useOrdersCore] Carregando pedidos para role:', userRole);
      
      let query = supabase
        .from('orders')
        .select(`
          *,
          order_items (*)
        `);

      // Se for vendedor, filtrar apenas pedidos onde ele é o vendedor
      if (userRole === 'seller') {
        query = query.eq('salesperson_id', user.id);
        console.log('[useOrdersCore] Filtrando pedidos do vendedor:', user.id);
      }
      
      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) throw error;

      console.log('[useOrdersCore] Pedidos carregados:', data?.length);
      setOrders(data || []);
    } catch (error: any) {
      console.error('[useOrdersCore] Erro ao carregar pedidos:', error);
      toast.error('Erro ao carregar pedidos: ' + (error.message || 'Erro desconhecido'));
    } finally {
      setLoading(false);
    }
  }, [user, userRole]);

  // DEPRECATED: createOrder movido para useOrders.ts
  // Use useOrderInsert.tsx para criar novos pedidos
  const createOrder = async () => {
    throw new Error('DEPRECATED: Use useOrderInsert hook instead');
  };

  const updateOrder = async (id: string, orderData: Partial<Order>) => {
    try {
      // Se for vendedor, verificar se pode editar este pedido
      if (userRole === 'seller') {
        const order = orders.find(o => o.id === id);
        if (order && order.salesperson_id !== user.id) {
          throw new Error('Você só pode editar seus próprios pedidos');
        }
      }

      const { error } = await supabase
        .from('orders')
        .update(orderData)
        .eq('id', id);

      if (error) throw error;

      await loadOrders();
      toast.success('Pedido atualizado com sucesso!');
    } catch (error: any) {
      console.error('[useOrdersCore] Erro ao atualizar pedido:', error);
      toast.error('Erro ao atualizar pedido: ' + (error.message || 'Erro desconhecido'));
      throw error;
    }
  };

  const deleteOrder = async (id: string) => {
    try {
      // Se for vendedor, verificar se pode deletar este pedido
      if (userRole === 'seller') {
        const order = orders.find(o => o.id === id);
        if (order && order.salesperson_id !== user.id) {
          throw new Error('Você só pode excluir seus próprios pedidos');
        }
      }

      const { error } = await supabase
        .from('orders')
        .delete()
        .eq('id', id);

      if (error) throw error;

      await loadOrders();
      toast.success('Pedido excluído com sucesso!');
    } catch (error: any) {
      console.error('[useOrdersCore] Erro ao excluir pedido:', error);
      toast.error('Erro ao excluir pedido: ' + (error.message || 'Erro desconhecido'));
      throw error;
    }
  };

  const getOrderById = useCallback((orderId: string) => {
    return orders.find(order => order.id === orderId);
  }, [orders]);

  const refreshOrders = loadOrders;

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  return {
    orders,
    loading,
    loadOrders,
    refreshOrders,
    createOrder,
    updateOrder,
    deleteOrder,
    getOrderById,
  };
};
