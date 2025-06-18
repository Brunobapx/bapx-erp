
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type FinancialEntryForReconciliation = {
  id: string;
  description: string;
  amount: number;
  due_date: string;
  type: string;
  payment_status: string;
  entry_number: string;
  client_id?: string;
  source: 'financial_entries' | 'accounts_payable';
};

export function useFinancialEntriesForReconciliation() {
  const { data: entries = [], isLoading, error, refetch } = useQuery({
    queryKey: ['financial_entries_reconciliation'],
    queryFn: async (): Promise<FinancialEntryForReconciliation[]> => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error("Usuário não autenticado");

        console.log('Buscando lançamentos para conciliação...');

        // Buscar lançamentos financeiros pendentes
        const { data: financialEntries, error: financialError } = await supabase
          .from("financial_entries")
          .select("id, description, amount, due_date, type, payment_status, entry_number, client_id")
          .eq("user_id", user.id)
          .eq("payment_status", "pending")
          .order("due_date", { ascending: false });

        if (financialError) {
          console.error('Erro ao buscar financial_entries:', financialError);
          throw financialError;
        }

        // Buscar contas a pagar pendentes
        const { data: accountsPayable, error: payableError } = await supabase
          .from("accounts_payable")
          .select("id, description, amount, due_date, status, invoice_number")
          .eq("user_id", user.id)
          .eq("status", "pending")
          .order("due_date", { ascending: false });

        if (payableError) {
          console.error('Erro ao buscar accounts_payable:', payableError);
          // Não falhar aqui, apenas continuar sem contas a pagar
        }

        const allEntries: FinancialEntryForReconciliation[] = [];

        // Adicionar lançamentos financeiros
        if (financialEntries) {
          financialEntries.forEach(entry => {
            allEntries.push({
              id: entry.id,
              description: entry.description,
              amount: Number(entry.amount),
              due_date: entry.due_date,
              type: entry.type,
              payment_status: entry.payment_status,
              entry_number: entry.entry_number,
              client_id: entry.client_id,
              source: 'financial_entries'
            });
          });
        }

        // Adicionar contas a pagar (se existirem)
        if (accountsPayable) {
          accountsPayable.forEach(payable => {
            // Verificar se já existe um lançamento financeiro equivalente
            const exists = allEntries.some(entry => 
              entry.type === 'payable' && 
              entry.description.includes(payable.description) &&
              Math.abs(entry.amount - Number(payable.amount)) < 0.01
            );

            if (!exists) {
              allEntries.push({
                id: payable.id,
                description: payable.description,
                amount: Number(payable.amount),
                due_date: payable.due_date,
                type: 'payable',
                payment_status: payable.status,
                entry_number: payable.invoice_number || `PAY-${payable.id.slice(-6)}`,
                source: 'accounts_payable'
              });
            }
          });
        }

        console.log(`Total de lançamentos para conciliação: ${allEntries.length}`);
        console.log('Tipos encontrados:', [...new Set(allEntries.map(e => e.type))]);
        
        return allEntries;
      } catch (err: any) {
        console.error('Erro ao buscar lançamentos para conciliação:', err);
        throw err;
      }
    },
    staleTime: 30 * 1000 // 30 segundos
  });

  const findSimilarEntries = (valor: number, data: string, tipo: string) => {
    const targetDate = new Date(data);
    const toleranceDays = 5; // 5 dias de tolerância
    const toleranceAmount = 0.01; // 1 centavo de tolerância
    
    console.log(`Buscando similaridades para: valor=${valor}, data=${data}, tipo=${tipo}`);
    console.log(`Total de lançamentos disponíveis: ${entries.length}`);
    
    const similar = entries.filter(entry => {
      const entryDate = new Date(entry.due_date);
      const daysDiff = Math.abs((targetDate.getTime() - entryDate.getTime()) / (1000 * 60 * 60 * 24));
      const amountDiff = Math.abs(Math.abs(valor) - entry.amount);
      
      // Verificar se o tipo é compatível (crédito = receivable, débito = payable)
      const typeMatch = (tipo === 'credito' && entry.type === 'receivable') ||
                       (tipo === 'debito' && entry.type === 'payable');
      
      const isMatch = daysDiff <= toleranceDays && amountDiff <= toleranceAmount && typeMatch;
      
      if (isMatch) {
        console.log(`Match encontrado: ${entry.description} - valor: ${entry.amount}, data: ${entry.due_date}`);
      }
      
      return isMatch;
    });

    console.log(`Encontradas ${similar.length} entradas similares`);
    return similar;
  };

  return {
    entries,
    loading: isLoading,
    error: error?.message || null,
    refreshEntries: refetch,
    findSimilarEntries,
  };
}
