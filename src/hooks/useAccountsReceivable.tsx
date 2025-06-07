
import { useState, useEffect } from 'react';
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

export type AccountReceivable = {
  id: string;
  client: string;
  description: string;
  amount: number;
  dueDate: string;
  status: 'pendente' | 'recebido' | 'vencido';
  saleId?: string;
  entry_number: string;
  client_id?: string;
  payment_date?: string;
};

export const useAccountsReceivable = () => {
  const [accountsReceivable, setAccountsReceivable] = useState<AccountReceivable[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAccountsReceivable = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('useAccountsReceivable - Iniciando busca de contas a receber...');
      
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError || !user) {
        throw new Error('Usuário não autenticado');
      }

      const { data, error } = await supabase
        .from('financial_entries')
        .select(`
          *,
          clients(name)
        `)
        .eq('user_id', user.id)
        .eq('type', 'receivable')
        .order('due_date', { ascending: true });

      if (error) throw error;

      const today = new Date().toISOString().split('T')[0];
      
      const receivables: AccountReceivable[] = (data || []).map(entry => {
        let status: 'pendente' | 'recebido' | 'vencido' = 'pendente';
        
        if (entry.payment_status === 'paid') {
          status = 'recebido';
        } else if (entry.due_date < today) {
          status = 'vencido';
        }

        return {
          id: entry.id,
          client: (entry.clients as any)?.name || 'Cliente não informado',
          description: entry.description,
          amount: Number(entry.amount),
          dueDate: entry.due_date,
          status,
          saleId: entry.sale_id,
          entry_number: entry.entry_number,
          client_id: entry.client_id,
          payment_date: entry.payment_date
        };
      });

      console.log('useAccountsReceivable - Contas a receber processadas:', receivables);
      setAccountsReceivable(receivables);
      
    } catch (err: any) {
      console.error('useAccountsReceivable - Erro ao buscar contas a receber:', err);
      setError(err.message || 'Erro ao carregar contas a receber');
      toast.error('Erro ao carregar contas a receber: ' + (err.message || 'Erro desconhecido'));
      setAccountsReceivable([]);
    } finally {
      setLoading(false);
    }
  };

  const confirmReceivable = async (receivableId: string) => {
    try {
      const { error } = await supabase
        .from('financial_entries')
        .update({ 
          payment_status: 'paid',
          payment_date: new Date().toISOString().split('T')[0],
          updated_at: new Date().toISOString()
        })
        .eq('id', receivableId);

      if (error) throw error;

      toast.success('Recebimento confirmado!');
      fetchAccountsReceivable();
    } catch (error: any) {
      console.error('Erro ao confirmar recebimento:', error);
      toast.error('Erro ao confirmar recebimento');
    }
  };

  const refreshReceivables = () => {
    console.log('useAccountsReceivable - Atualizando contas a receber...');
    fetchAccountsReceivable();
  };

  useEffect(() => {
    fetchAccountsReceivable();
  }, []);

  return {
    accountsReceivable,
    loading,
    error,
    confirmReceivable,
    refreshReceivables
  };
};
