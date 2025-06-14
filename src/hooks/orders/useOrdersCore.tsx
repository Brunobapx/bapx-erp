
import { useState, useEffect } from 'react';
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { checkStockAndSendToProduction, sendToProduction, deductIngredientsFromStock } from "./useOrdersStock";
import {
  translateStatus,
  formatCurrency,
  isOrderCompleted,
  getFirstOrderItem
} from "./useOrdersHelpers";
import type { Order, OrderStatus, OrderItem } from "../useOrders";

export const useOrdersCore = () => {
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
        if (userError || !user) throw new Error('Usuário não autenticado');

        const { data, error } = await supabase
          .from('orders')
          .select(`*, order_items (*)`)
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        if (error) throw error;
        setOrders(data || []);
      } catch (error: any) {
        setError(error.message || 'Erro ao carregar pedidos');
        toast.error('Erro ao carregar pedidos');
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, [refreshTrigger]);

  const refreshOrders = () => setRefreshTrigger(prev => prev + 1);

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
      toast.error('Erro ao excluir pedido');
      return false;
    }
  };

  const getOrderById = (id: string) => orders.find(order => order.id === id) || null;

  return {
    orders,
    loading,
    error,
    refreshOrders,
    deleteOrder,
    sendToProduction: (orderId: string) => sendToProduction(orderId, deductIngredientsFromStock, refreshOrders),
    checkStockAndSendToProduction,
    formatCurrency,
    getOrderById,
    isOrderCompleted,
    getFirstOrderItem,
    translateStatus,
  };
};
