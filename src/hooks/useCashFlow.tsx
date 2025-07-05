
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from '@/components/Auth/AuthProvider';

export type CashFlowEntry = {
  id: string;
  date: string;
  description: string;
  type: 'entrada' | 'saida';
  amount: number;
  balance: number;
  category?: string;
  account?: string;
  reference_id?: string;
  reference_type?: string;
};

export const useCashFlow = () => {
  const { user } = useAuth();

  const { data: cashFlowData = [], isLoading, error, refetch } = useQuery({
    queryKey: ['cashFlow'],
    queryFn: async (): Promise<CashFlowEntry[]> => {
      try {
        console.log('Calculando fluxo de caixa unificado...');
        
        if (!user) throw new Error('Usuário não autenticado');

        // Buscar todos os lançamentos financeiros pagos (gestão colaborativa)
        const { data: financialEntries, error: financialError } = await supabase
          .from('financial_entries')
          .select('*')
          .eq('payment_status', 'paid')
          .order('payment_date', { ascending: true });

        if (financialError) {
          console.error('Erro ao buscar financial_entries:', financialError);
          throw financialError;
        }

        // Buscar todas as contas a pagar pagas (gestão colaborativa)
        const { data: accountsPayable, error: payableError } = await supabase
          .from('accounts_payable')
          .select('*')
          .eq('status', 'paid')
          .order('payment_date', { ascending: true });

        if (payableError) {
          console.error('Erro ao buscar accounts_payable:', payableError);
          // Não falhar aqui, continuar sem contas a pagar
        }

        const cashFlow: CashFlowEntry[] = [];

        // Adicionar lançamentos financeiros
        if (financialEntries) {
          financialEntries.forEach(entry => {
            cashFlow.push({
              id: entry.id,
              date: entry.payment_date || entry.due_date,
              description: entry.description,
              type: entry.type === 'receivable' ? 'entrada' : 'saida',
              amount: Number(entry.amount),
              balance: 0, // Will be calculated later
              category: entry.category || (entry.type === 'receivable' ? 'Vendas' : 'Despesas'),
              account: entry.account || undefined,
              reference_id: entry.sale_id || entry.order_id,
              reference_type: entry.sale_id ? 'sale' : (entry.order_id ? 'order' : 'manual')
            });
          });
        }

        // Adicionar contas a pagar (evitando duplicatas)
        if (accountsPayable) {
          accountsPayable.forEach(payable => {
            // Verificar se já existe um lançamento financeiro equivalente
            const exists = cashFlow.some(entry => 
              entry.type === 'saida' && 
              entry.description.includes(payable.description) &&
              Math.abs(entry.amount - Number(payable.amount)) < 0.01 &&
              entry.date === payable.payment_date
            );

            if (!exists) {
              cashFlow.push({
                id: payable.id,
                date: payable.payment_date || payable.due_date,
                description: payable.description,
                type: 'saida',
                amount: Number(payable.amount),
                balance: 0, // Will be calculated later
                category: payable.category || 'Compras',
                account: payable.account || undefined,
                reference_id: payable.purchase_id,
                reference_type: 'purchase'
              });
            }
          });
        }

        // Ordenar por data
        cashFlow.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

        // Calcular saldos progressivos
        let balance = 0;
        cashFlow.forEach(item => {
          if (item.type === 'entrada') {
            balance += item.amount;
          } else {
            balance -= item.amount;
          }
          item.balance = balance;
        });

        console.log(`Fluxo de caixa calculado: ${cashFlow.length} movimentações`);
        return cashFlow;
        
      } catch (err: any) {
        console.error('Erro no useCashFlow:', err);
        throw new Error(err.message || 'Erro ao carregar fluxo de caixa');
      }
    },
    enabled: !!user,
    staleTime: 30 * 1000, // 30 segundos
    retry: 2
  });

  return {
    cashFlowData,
    loading: isLoading,
    error: error?.message || null,
    refreshCashFlow: refetch
  };
};
