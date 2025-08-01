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

        let query = supabase
          .from('sales')
          .select(`
            *,
            orders!inner(
              order_number,
              client_name
            )
          `);

        // Se for vendedor, filtrar apenas vendas onde ele é o vendedor
        if (userRole === 'seller') {
          query = query.eq('salesperson_id', user.id);
          console.log('[useSales] Filtrando vendas do vendedor:', user.id);
        }

        const { data, error } = await query.order('created_at', { ascending: false });
        
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
      // Se for vendedor, verificar se pode editar esta venda
      if (userRole === 'seller' && authUser) {
        const sale = sales.find(s => s.id === id);
        if (sale && sale.salesperson_id !== authUser.id) {
          throw new Error('Você só pode editar suas próprias vendas');
        }
      }
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

      console.log(`[APPROVE_SALE] Usuário autenticado: ${user.id}`);

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

      console.log(`[APPROVE_SALE] Dados da venda:`, {
        id: sale.id,
        sale_number: sale.sale_number,
        client_name: sale.client_name,
        total_amount: sale.total_amount,
        status: sale.status
      });

      // Verificação robusta para lançamentos existentes usando a constraint única
      const { data: existingEntries, error: checkError } = await supabase
        .from('financial_entries')
        .select('id, description, created_at')
        .eq('sale_id', saleId)
        .eq('user_id', user.id)
        .eq('type', 'receivable');

      if (checkError) {
        console.error(`[APPROVE_SALE] Erro ao verificar lançamentos existentes:`, checkError);
        throw checkError;
      }

      console.log(`[APPROVE_SALE] Lançamentos existentes encontrados: ${existingEntries?.length || 0}`);

      // Se já existe um lançamento financeiro, apenas atualizar status da venda
      if (existingEntries && existingEntries.length > 0) {
        console.log(`[APPROVE_SALE] Lançamento já existe, apenas atualizando status da venda`);
        
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
        
        toast.success('Venda aprovada com sucesso');
        refreshSales();
        return true;
      }

      // Calcular data de vencimento baseada no prazo
      let dueDate = new Date();
      if (sale.payment_term) {
        const days = parseInt(sale.payment_term.match(/\d+/)?.[0] || '30');
        dueDate.setDate(dueDate.getDate() + days);
      } else {
        dueDate.setDate(dueDate.getDate() + 30); // Padrão 30 dias
      }

      console.log(`[APPROVE_SALE] Data de vencimento calculada: ${dueDate.toISOString().split('T')[0]}`);

      // Primeiro, atualizar o status da venda
      const { error: updateError } = await supabase
        .from('sales')
        .update({
          status: 'confirmed',
          confirmed_at: new Date().toISOString(),
          confirmed_by: user.email || 'Sistema',
          updated_at: new Date().toISOString()
        })
        .eq('id', saleId);

      if (updateError) {
        console.error(`[APPROVE_SALE] Erro ao atualizar venda:`, updateError);
        throw updateError;
      }

      // Criar descrição completa incluindo o nome do cliente
      const clientName = sale.orders?.client_name || sale.client_name || 'Cliente não identificado';
      const description = `Venda confirmada - ${sale.sale_number} - ${clientName}`;
      
      console.log(`[APPROVE_SALE] Criando lançamento financeiro com descrição: ${description}`);

      // Tentar criar o lançamento financeiro
      const { data: financialEntry, error: financialError } = await supabase
        .from('financial_entries')
        .insert({
          user_id: user.id,
          sale_id: saleId,
          order_id: sale.order_id,
          client_id: sale.client_id,
          type: 'receivable',
          description: description,
          amount: sale.total_amount,
          due_date: dueDate.toISOString().split('T')[0],
          payment_status: 'pending',
          account: sale.payment_method || '',
          notes: `Venda aprovada em ${new Date().toLocaleDateString('pt-BR')} por ${user.email || 'Sistema'}`
        })
        .select()
        .single();

      if (financialError) {
        console.error(`[APPROVE_SALE] Erro ao criar lançamento financeiro:`, financialError);
        
        // Se o erro for de constraint única (23505), significa que já existe um lançamento
        if (financialError.code === '23505') {
          console.log(`[APPROVE_SALE] Lançamento já existe devido à constraint única, operação bem-sucedida`);
          toast.success('Venda aprovada com sucesso');
          refreshSales();
          return true;
        }
        
        // Para outros erros, tentar reverter o status da venda
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

      console.log(`[APPROVE_SALE] Venda aprovada com sucesso - ID: ${saleId}`, financialEntry);
      toast.success('Venda aprovada e lançamento criado em contas a receber');
      refreshSales();
      return true;

    } catch (error: any) {
      console.error(`[APPROVE_SALE] Erro ao aprovar venda ${saleId}:`, error);
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
