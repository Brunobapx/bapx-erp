
import { useQuery } from '@tanstack/react-query';
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export type UnifiedFinancialEntry = {
  id: string;
  user_id: string;
  type: 'receivable' | 'payable';
  description: string;
  amount: number;
  due_date: string;
  payment_date?: string;
  payment_status: 'pending' | 'paid' | 'overdue' | 'cancelled';
  entry_number: string;
  category?: string;
  account?: string;
  notes?: string;
  sale_id?: string;
  order_id?: string;
  client_id?: string;
  created_at: string;
  updated_at: string;
};

export const useUnifiedFinancialEntries = () => {
  const { data: entries = [], isLoading, error, refetch } = useQuery({
    queryKey: ['financial_entries'],
    queryFn: async (): Promise<UnifiedFinancialEntry[]> => {
      try {
        console.log('Fetching unified financial entries...');
        
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        
        if (userError || !user) {
          throw new Error('Usuário não autenticado');
        }

        // Buscar todos os lançamentos financeiros
        const { data: financialEntries, error: financialError } = await supabase
          .from('financial_entries')
          .select('*')
          .eq('user_id', user.id)
          .order('due_date', { ascending: true });

        if (financialError) {
          console.error('Erro ao buscar financial_entries:', financialError);
          throw financialError;
        }

        // Buscar contas a pagar (accounts_payable) e converter para o formato unificado
        const { data: accountsPayable, error: payableError } = await supabase
          .from('accounts_payable')
          .select('*')
          .eq('user_id', user.id)
          .order('due_date', { ascending: true });

        if (payableError) {
          console.error('Erro ao buscar accounts_payable:', payableError);
          // Não falhar aqui, apenas log o erro
        }

        const unifiedEntries: UnifiedFinancialEntry[] = [];

        // Adicionar lançamentos financeiros
        if (financialEntries) {
          financialEntries.forEach(entry => {
            unifiedEntries.push({
              id: entry.id,
              user_id: entry.user_id,
              type: entry.type,
              description: entry.description,
              amount: Number(entry.amount),
              due_date: entry.due_date,
              payment_date: entry.payment_date,
              payment_status: entry.payment_status,
              entry_number: entry.entry_number,
              category: entry.category,
              account: entry.account,
              notes: entry.notes,
              sale_id: entry.sale_id,
              order_id: entry.order_id,
              client_id: entry.client_id,
              created_at: entry.created_at,
              updated_at: entry.updated_at
            });
          });
        }

        // Adicionar contas a pagar (se existirem e não estiverem duplicadas)
        if (accountsPayable) {
          accountsPayable.forEach(payable => {
            // Verificar se já existe um lançamento financeiro para este payable
            const existingEntry = unifiedEntries.find(entry => 
              entry.type === 'payable' && 
              entry.description.includes(payable.description) &&
              Math.abs(entry.amount - Number(payable.amount)) < 0.01
            );

            if (!existingEntry) {
              unifiedEntries.push({
                id: payable.id,
                user_id: payable.user_id,
                type: 'payable',
                description: payable.description,
                amount: Number(payable.amount),
                due_date: payable.due_date,
                payment_date: payable.payment_date,
                payment_status: payable.status === 'paid' ? 'paid' : 'pending',
                entry_number: payable.invoice_number || `PAY-${payable.id.slice(-6)}`,
                category: payable.category,
                account: payable.account,
                notes: payable.notes,
                created_at: payable.created_at,
                updated_at: payable.updated_at
              });
            }
          });
        }

        console.log(`Total unified entries loaded: ${unifiedEntries.length}`);
        return unifiedEntries.sort((a, b) => new Date(a.due_date).getTime() - new Date(b.due_date).getTime());
        
      } catch (err: any) {
        console.error('Erro no useUnifiedFinancialEntries:', err);
        throw new Error(err.message || 'Erro ao carregar lançamentos financeiros');
      }
    },
    staleTime: 30 * 1000, // 30 segundos
    retry: 2
  });

  return {
    entries,
    loading: isLoading,
    error: error?.message || null,
    refreshEntries: refetch
  };
};
