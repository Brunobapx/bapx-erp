
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

  const approveSale = async (saleId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      // Buscar dados da venda
      const { data: sale, error: saleError } = await supabase
        .from('sales')
        .select('*')
        .eq('id', saleId)
        .single();

      if (saleError) throw saleError;
      if (!sale) throw new Error('Venda não encontrada');

      // Verificar se já existe um lançamento financeiro para esta venda específica
      const { data: existingEntries, error: checkError } = await supabase
        .from('financial_entries')
        .select('id, description')
        .eq('sale_id', saleId)
        .eq('user_id', user.id);

      if (checkError && checkError.code !== 'PGRST116') {
        throw checkError;
      }

      // Se já existem lançamentos, remover os incompletos e manter apenas um completo
      if (existingEntries && existingEntries.length > 0) {
        console.log('Lançamentos existentes encontrados:', existingEntries);
        
        // Encontrar o lançamento mais completo (com nome do cliente)
        const completeEntry = existingEntries.find(entry => 
          entry.description.includes(sale.client_name)
        );
        
        if (completeEntry) {
          // Remover os lançamentos incompletos
          const incompleteEntries = existingEntries.filter(entry => entry.id !== completeEntry.id);
          
          for (const entry of incompleteEntries) {
            await supabase
              .from('financial_entries')
              .delete()
              .eq('id', entry.id);
          }
          
          // Apenas atualizar status da venda
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
          
          toast.success('Venda aprovada e lançamentos duplicados removidos');
          refreshSales();
          return true;
        }
      }

      // Calcular data de vencimento baseada no prazo
      let dueDate = new Date();
      if (sale.payment_term) {
        const days = parseInt(sale.payment_term.match(/\d+/)?.[0] || '30');
        dueDate.setDate(dueDate.getDate() + days);
      } else {
        dueDate.setDate(dueDate.getDate() + 30); // Padrão 30 dias
      }

      // Atualizar status da venda primeiro
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

      // Criar lançamento em contas a receber com descrição completa
      const { error: financialError } = await supabase
        .from('financial_entries')
        .insert({
          user_id: user.id,
          sale_id: saleId,
          order_id: sale.order_id,
          client_id: sale.client_id,
          type: 'receivable',
          description: `Venda confirmada - ${sale.sale_number} - ${sale.client_name}`,
          amount: sale.total_amount,
          due_date: dueDate.toISOString().split('T')[0],
          payment_status: 'pending',
          account: sale.payment_method || '',
          notes: `Venda aprovada em ${new Date().toLocaleDateString('pt-BR')}`
        });

      if (financialError) throw financialError;

      toast.success('Venda aprovada e lançamento criado em contas a receber');
      refreshSales();
      return true;
    } catch (error: any) {
      console.error('Erro ao aprovar venda:', error);
      toast.error('Erro ao aprovar venda: ' + error.message);
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
