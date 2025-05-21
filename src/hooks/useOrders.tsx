
import { useState, useEffect } from 'react';
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

export type Order = {
  id: string | number;
  client_id?: string;
  client_name?: string;
  product_id?: string;
  product_name?: string;
  quantity?: number;
  unit_price?: number;
  total_price?: number;
  delivery_deadline?: string | null;
  payment_method?: string;
  payment_term?: string;
  seller?: string;
  status?: string;
  statusType?: string;
  completed?: boolean;
  created_at?: string;
  updated_at?: string;
  user_id?: string;
};

export const useOrders = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Fetch orders from Supabase
  useEffect(() => {
    const fetchOrders = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const { data, error } = await supabase.from('orders').select('*');
        
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

  // Refresh orders list
  const refreshOrders = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  // Delete an order
  const deleteOrder = async (id: string | number) => {
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

  // Format currency for display
  const formatCurrency = (value?: number) => {
    if (!value && value !== 0) return 'R$ 0,00';
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  return {
    orders,
    loading,
    error,
    refreshOrders,
    deleteOrder,
    formatCurrency
  };
};
