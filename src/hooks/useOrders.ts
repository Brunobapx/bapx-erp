import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/components/Auth/AuthProvider';
import { checkStockAndSendToProduction, sendToProduction as sendToProductionStock } from './orders/useOrdersStock';

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
  salesperson_id?: string;
  seller?: string;
  payment_method?: string;
  payment_term?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
  order_items?: OrderItem[];
}

export const useOrders = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const { user } = useAuth();

  const loadOrders = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      console.log('[useOrders] Carregando todos os pedidos (gestão colaborativa)');
      
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          order_items (*)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      console.log('[useOrders] Pedidos carregados:', data?.length);
      setOrders(data || []);
    } catch (error: any) {
      console.error('[useOrders] Erro ao carregar pedidos:', error);
      toast({
        title: "Erro",
        description: error.message || "Erro ao carregar pedidos",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

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
      toast({
        title: "Sucesso",
        description: "Pedido criado com sucesso!",
      });

      return data;
    } catch (error: any) {
      console.error('[useOrders] Erro ao criar pedido:', error);
      toast({
        title: "Erro",
        description: error.message || "Erro ao criar pedido",
        variant: "destructive",
      });
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
      toast({
        title: "Sucesso",
        description: "Pedido atualizado com sucesso!",
      });
    } catch (error: any) {
      console.error('[useOrders] Erro ao atualizar pedido:', error);
      toast({
        title: "Erro",
        description: error.message || "Erro ao atualizar pedido",
        variant: "destructive",
      });
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
      toast({
        title: "Sucesso",
        description: "Pedido excluído com sucesso!",
      });
    } catch (error: any) {
      console.error('[useOrders] Erro ao excluir pedido:', error);
      toast({
        title: "Erro",
        description: error.message || "Erro ao excluir pedido",
        variant: "destructive",
      });
      throw error;
    }
  };

  const getOrderById = useCallback((orderId: string) => {
    return orders.find(order => order.id === orderId);
  }, [orders]);

  const refreshOrders = loadOrders;

  const sendToProduction = async (orderId: string) => {
    console.log('[useOrders] Usando checkStockAndSendToProduction para pedido:', orderId);
    const success = await checkStockAndSendToProduction(orderId);
    if (success) {
      await loadOrders();
    }
    return success;
  };

  const isOrderCompleted = (status: OrderStatus) => {
    return ['delivered', 'cancelled'].includes(status);
  };

  const getFirstOrderItem = (order: Order) => {
    return order.order_items?.[0];
  };

  const translateStatus = (status: OrderStatus) => {
    const statusMap: Record<OrderStatus, string> = {
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
    return statusMap[status] || status;
  };

  useEffect(() => {
    loadOrders();
  }, [user]);

  return {
    orders,
    loading,
    loadOrders,
    refreshOrders,
    createOrder,
    updateOrder,
    deleteOrder,
    getOrderById,
    sendToProduction,
    checkStockAndSendToProduction,
    isOrderCompleted,
    getFirstOrderItem,
    translateStatus,
  };
};
