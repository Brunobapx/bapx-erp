
import { useState, useEffect } from 'react';
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

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

export type Order = {
  id: string;
  order_number: string;
  client_id: string;
  client_name: string;
  seller?: string;
  status: OrderStatus;
  total_amount: number;
  delivery_deadline?: string;
  payment_method?: string;
  payment_term?: string;
  notes?: string;
  created_at?: string;
  updated_at?: string;
  user_id?: string;
  order_items?: OrderItem[];
};

export type OrderItem = {
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
};

export const useOrders = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        
        if (userError || !user) {
          throw new Error('Usuário não autenticado');
        }

        const { data, error } = await supabase
          .from('orders')
          .select(`
            *,
            order_items (*)
          `)
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });
        
        if (error) throw error;
        
        setOrders(data || []);
      } catch (error: any) {
        console.error('Erro ao carregar pedidos:', error);
        setError(error.message || 'Erro ao carregar pedidos');
        toast.error('Erro ao carregar pedidos');
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, [refreshTrigger]);

  const refreshOrders = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  const deleteOrder = async (id: string) => {
    try {
      const { error } = await supabase
        .from('orders')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      
      toast.success('Pedido excluído com sucesso');
      refreshOrders();
      return true;
    } catch (error: any) {
      console.error('Erro ao excluir pedido:', error);
      toast.error('Erro ao excluir pedido');
      return false;
    }
  };

  const sendToProduction = async (orderId: string) => {
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError || !user) {
        throw new Error('Usuário não autenticado');
      }

      // Get order with items
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .select(`
          *,
          order_items (*)
        `)
        .eq('id', orderId)
        .single();
      
      if (orderError) throw orderError;
      if (!order) throw new Error('Pedido não encontrado');

      // Create production entries for each order item
      const productionEntries = order.order_items.map((item: OrderItem) => ({
        user_id: user.id,
        order_item_id: item.id,
        product_id: item.product_id,
        product_name: item.product_name,
        quantity_requested: item.quantity,
        status: 'pending'
      }));

      const { error: productionError } = await supabase
        .from('production')
        .insert(productionEntries);
      
      if (productionError) throw productionError;

      // Update order status
      const { error: updateError } = await supabase
        .from('orders')
        .update({ 
          status: 'in_production',
          updated_at: new Date().toISOString()
        })
        .eq('id', orderId);
      
      if (updateError) throw updateError;
      
      toast.success('Pedido enviado para produção com sucesso');
      refreshOrders();
      return true;
    } catch (error: any) {
      console.error('Erro ao enviar para produção:', error);
      toast.error('Erro ao enviar para produção');
      return false;
    }
  };

  // Função para traduzir status para português
  const translateStatus = (status: OrderStatus): string => {
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

  const formatCurrency = (value?: number) => {
    if (!value && value !== 0) return 'R$ 0,00';
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const getOrderById = (id: string) => {
    return orders.find(order => order.id === id) || null;
  };

  // Função auxiliar para verificar se um pedido está completo
  const isOrderCompleted = (status: OrderStatus) => {
    return ['delivered', 'cancelled'].includes(status);
  };

  // Função auxiliar para obter o primeiro item do pedido
  const getFirstOrderItem = (order: Order) => {
    return order.order_items?.[0] || null;
  };

  return {
    orders,
    loading,
    error,
    refreshOrders,
    deleteOrder,
    sendToProduction,
    formatCurrency,
    getOrderById,
    isOrderCompleted,
    getFirstOrderItem,
    translateStatus
  };
};
