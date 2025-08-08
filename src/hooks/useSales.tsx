import { useState, useEffect } from 'react';
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/components/Auth/AuthProvider";

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
  salesperson_id?: string;
  orders?: {
    order_number: string;
    client_name: string;
  };
  seller?: string;
};

export const useSales = () => {
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const { userRole, user: authUser } = useAuth();

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
          .order('created_at', { ascending: false });
        
        if (error) throw error;
        
        // Mapear os dados para incluir order_number
        const salesWithOrderInfo = (data || []).map(sale => ({
          ...sale,
          order_number: sale.orders?.order_number || '',
          seller: 'N/A' // Removido referência ao seller inexistente
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
  }, [refreshTrigger, userRole]);

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

  const approveSale = async (saleId: string) => {
    try {
      console.log(`[APPROVE_SALE] Iniciando aprovação da venda: ${saleId}`);
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      // Buscar dados completos da venda com informações do cliente
      const { data: sale, error: saleError } = await supabase
        .from('sales')
        .select(`
          *,
          orders!inner(
            order_number,
            client_name
          )
        `)
        .eq('id', saleId)
        .single();

      if (saleError) throw saleError;
      if (!sale) throw new Error('Venda não encontrada');

      // 1) Atualizar o status da venda primeiro (se existir trigger no BD, ele cria o lançamento aqui)
      const { error: updateError } = await supabase
        .from('sales')
        .update({
          status: 'confirmed',
          confirmed_at: new Date().toISOString(),
          confirmed_by: user.email || 'Sistema',
          updated_at: new Date().toISOString()
        })
        .eq('id', saleId);

      if (updateError) throw updateError;

      // 2) Checar se já existe lançamento criado (por trigger ou execução anterior)
      const { data: existingEntries, error: checkAfterUpdateError } = await supabase
        .from('financial_entries')
        .select('id')
        .eq('sale_id', saleId)
        .eq('user_id', user.id)
        .eq('type', 'receivable');

      if (checkAfterUpdateError) throw checkAfterUpdateError;

      // Se não existir, cria manualmente
      if (!existingEntries || existingEntries.length === 0) {
        // Calcular data de vencimento baseada no prazo
        let dueDate = new Date();
        if (sale.payment_term) {
          const days = parseInt(sale.payment_term.match(/\d+/)?.[0] || '30');
          dueDate.setDate(dueDate.getDate() + days);
        } else {
          dueDate.setDate(dueDate.getDate() + 30); // Padrão 30 dias
        }

        const clientName = sale.orders?.client_name || sale.client_name || 'Cliente não identificado';
        const description = `Venda confirmada - ${sale.sale_number} - ${clientName}`;

        const { error: financialError } = await supabase
          .from('financial_entries')
          .insert({
            user_id: user.id,
            sale_id: saleId,
            order_id: sale.order_id,
            client_id: sale.client_id,
            type: 'receivable',
            description,
            amount: sale.total_amount,
            due_date: dueDate.toISOString().split('T')[0],
            payment_status: 'pending',
            account: sale.payment_method || '',
            notes: `Venda aprovada em ${new Date().toLocaleDateString('pt-BR')} por ${user.email || 'Sistema'}`
          })
          .select()
          .single();

        // Se houve erro mas for de UNIQUE (23505), significa corrida com outra criação: tratar como sucesso
        if (financialError && financialError.code !== '23505') {
          await supabase
            .from('sales')
            .update({
              status: 'pending',
              confirmed_at: null,
              confirmed_by: null,
              updated_at: new Date().toISOString()
            })
            .eq('id', saleId);
          throw financialError;
        }
      }

      toast.success('Venda aprovada com sucesso');
      refreshSales();
      return true;

    } catch (error: any) {
      console.error(`[APPROVE_SALE] Erro ao aprovar venda ${saleId}:`, error);
      toast.error('Erro ao aprovar venda: ' + (error?.message || 'Desconhecido'));
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
    approveSale,
    createSaleFromPackaging
  };
};
