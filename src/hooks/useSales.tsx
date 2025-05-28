
import { useState, useEffect } from 'react';
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

export type SaleStatus = 
  | 'pending'
  | 'confirmed'
  | 'invoiced'
  | 'delivered'
  | 'cancelled';

export type Sale = {
  id: string;
  sale_number: string;
  order_id: string;
  client_id: string;
  client_name: string;
  total_amount: number;
  status: SaleStatus;
  payment_method?: string;
  payment_term?: string;
  invoice_number?: string;
  invoice_date?: string;
  confirmed_by?: string;
  confirmed_at?: string;
  created_at?: string;
  updated_at?: string;
  user_id?: string;
  order_number?: string;
};

export const useSales = () => {
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  useEffect(() => {
    const fetchSales = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        
        if (userError || !user) {
          throw new Error('Usuário não autenticado');
        }

        const { data, error } = await supabase
          .from('sales')
          .select(`
            *,
            orders!inner(
              order_number,
              client_name
            )
          `)
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });
        
        if (error) throw error;
        
        // Mapear os dados para incluir order_number
        const salesWithOrderInfo = (data || []).map(sale => ({
          ...sale,
          order_number: sale.orders?.order_number || ''
        }));
        
        setSales(salesWithOrderInfo);
      } catch (error: any) {
        console.error('Erro ao carregar vendas:', error);
        setError(error.message || 'Erro ao carregar vendas');
        toast.error('Erro ao carregar vendas');
      } finally {
        setLoading(false);
      }
    };

    fetchSales();
  }, [refreshTrigger]);

  const refreshSales = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  const updateSaleStatus = async (id: string, status: SaleStatus, invoiceNumber?: string) => {
    try {
      const updateData: any = { 
        status,
        updated_at: new Date().toISOString()
      };
      
      if (status === 'confirmed') {
        updateData.confirmed_at = new Date().toISOString();
        const { data: { user } } = await supabase.auth.getUser();
        updateData.confirmed_by = user?.email || 'Sistema';
      }
      
      if (status === 'invoiced' && invoiceNumber) {
        updateData.invoice_number = invoiceNumber;
        updateData.invoice_date = new Date().toISOString().split('T')[0];
      }

      const { error } = await supabase
        .from('sales')
        .update(updateData)
        .eq('id', id);
      
      if (error) throw error;
      
      toast.success('Status de venda atualizado com sucesso');
      refreshSales();
      return true;
    } catch (error: any) {
      console.error('Erro ao atualizar venda:', error);
      toast.error('Erro ao atualizar venda');
      return false;
    }
  };

  const createSaleFromPackaging = async (packagingData: any) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('Usuário não autenticado');
      }

      // Buscar dados do pedido
      const { data: productionData, error: prodError } = await supabase
        .from('production')
        .select(`
          *,
          order_items!inner(
            order_id,
            quantity,
            unit_price,
            total_price,
            orders!inner(
              order_number,
              client_id,
              client_name,
              total_amount
            )
          )
        `)
        .eq('id', packagingData.production_id)
        .single();

      if (prodError) throw prodError;

      const orderData = productionData.order_items.orders;

      const saleData = {
        user_id: user.id,
        order_id: orderData.id,
        client_id: orderData.client_id,
        client_name: orderData.client_name,
        total_amount: orderData.total_amount,
        status: 'pending' as SaleStatus
      };

      const { data, error } = await supabase
        .from('sales')
        .insert(saleData)
        .select()
        .single();

      if (error) throw error;

      toast.success('Venda criada com sucesso');
      refreshSales();
      return data;
    } catch (error: any) {
      console.error('Erro ao criar venda:', error);
      toast.error('Erro ao criar venda');
      return null;
    }
  };

  return {
    sales,
    loading,
    error,
    refreshSales,
    updateSaleStatus,
    createSaleFromPackaging
  };
};
