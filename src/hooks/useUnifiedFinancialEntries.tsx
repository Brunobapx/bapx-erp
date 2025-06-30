
import { useQuery } from '@tanstack/react-query';
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from '@/components/Auth/AuthProvider';

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
  const { user, companyInfo } = useAuth();

  const { data: entries = [], isLoading, error, refetch } = useQuery({
    queryKey: ['financial_entries', companyInfo?.id],
    queryFn: async (): Promise<UnifiedFinancialEntry[]> => {
      try {
        console.log('Fetching unified financial entries...');
        
        if (!user || !companyInfo) {
          throw new Error('Usuário não autenticado ou empresa não encontrada');
        }

        // Buscar apenas os lançamentos financeiros da empresa
        const { data: financialEntries, error: financialError } = await supabase
          .from('financial_entries')
          .select('*')
          .eq('company_id', companyInfo.id) // Mudança aqui: usar company_id
          .order('due_date', { ascending: true });

        if (financialError) {
          console.error('Erro ao buscar financial_entries:', financialError);
          throw financialError;
        }

        const unifiedEntries: UnifiedFinancialEntry[] = [];

        // Processar apenas lançamentos financeiros (evita duplicação)
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

        console.log(`Total unified entries loaded: ${unifiedEntries.length}`);
        return unifiedEntries.sort((a, b) => new Date(a.due_date).getTime() - new Date(b.due_date).getTime());
        
      } catch (err: any) {
        console.error('Erro no useUnifiedFinancialEntries:', err);
        throw new Error(err.message || 'Erro ao carregar lançamentos financeiros');
      }
    },
    enabled: !!user && !!companyInfo,
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
