
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
  const { user } = useAuth();

  const loadOrders = useCallback(async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      console.log('[useOrdersCore] Carregando pedidos da empresa');
      
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          order_items (*)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      console.log('[useOrdersCore] Pedidos carregados:', data?.length);
      setOrders(data || []);
    } catch (error: any) {
      console.error('[useOrdersCore] Erro ao carregar pedidos:', error);
      toast.error('Erro ao carregar pedidos: ' + (error.message || 'Erro desconhecido'));
    } finally {
      setLoading(false);
    }
  }, [user]);

  const createOrder = async (orderData: Omit<Order, 'id' | 'order_number' | 'created_at' | 'updated_at'>) => {
    if (!user) throw new Error('Usuário não autenticado');

    try {
      const { data, error } = await supabase
        .from('orders')
        .insert([{
          ...orderData,
          user_id: user.id,
        }])
        .select()
        .single();

      if (error) throw error;

      await loadOrders();
      toast.success('Pedido criado com sucesso!');

      return data;
    } catch (error: any) {
      console.error('[useOrdersCore] Erro ao criar pedido:', error);
      toast.error('Erro ao criar pedido: ' + (error.message || 'Erro desconhecido'));
      throw error;
    }
  };

  const updateOrder = async (id: string, orderData: Partial<Order>) => {
    try {
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
