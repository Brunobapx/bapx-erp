
import { useState, useEffect } from 'react';
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

export type CashFlowEntry = {
  id: string;
  date: string;
  description: string;
  type: 'entrada' | 'saida';
  amount: number;
  balance: number;
  category?: string;
  reference_id?: string;
  reference_type?: string;
};

export const useCashFlow = () => {
  const [cashFlowData, setCashFlowData] = useState<CashFlowEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCashFlow = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('useCashFlow - Iniciando busca de fluxo de caixa...');
      
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError || !user) {
        throw new Error('Usuário não autenticado');
      }

      // Buscar lançamentos financeiros para construir o fluxo de caixa
      const { data: entries, error: entriesError } = await supabase
        .from('financial_entries')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: true });

      if (entriesError) throw entriesError;

      // Buscar contas a pagar
      const { data: payables, error: payablesError } = await supabase
        .from('accounts_payable')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: true });

      if (payablesError) throw payablesError;

      // Construir fluxo de caixa combinando receitas e despesas
      const cashFlow: CashFlowEntry[] = [];
      let runningBalance = 0;

      // Adicionar receitas (financial_entries tipo receivable)
      (entries || []).forEach(entry => {
        if (entry.type === 'receivable' && entry.payment_status === 'paid') {
          runningBalance += Number(entry.amount);
          cashFlow.push({
            id: entry.id,
            date: entry.payment_date || entry.due_date,
            description: entry.description,
            type: 'entrada',
            amount: Number(entry.amount),
            balance: runningBalance,
            category: entry.category || 'Vendas',
            reference_id: entry.sale_id,
            reference_type: 'sale'
          });
        }
      });

      // Adicionar despesas (accounts_payable pagas)
      (payables || []).forEach(payable => {
        if (payable.status === 'paid') {
          runningBalance -= Number(payable.amount);
          cashFlow.push({
            id: payable.id,
            date: payable.payment_date || payable.due_date,
            description: payable.description,
            type: 'saida',
            amount: Number(payable.amount),
            balance: runningBalance,
            category: payable.category || 'Compras',
            reference_id: payable.purchase_id,
            reference_type: 'purchase'
          });
        }
      });

      // Ordenar por data
      cashFlow.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

      // Recalcular saldos após ordenação
      let balance = 0;
      cashFlow.forEach(item => {
        if (item.type === 'entrada') {
          balance += item.amount;
        } else {
          balance -= item.amount;
        }
        item.balance = balance;
      });

      console.log('useCashFlow - Dados do fluxo de caixa processados:', cashFlow);
      setCashFlowData(cashFlow);
      
    } catch (err: any) {
      console.error('useCashFlow - Erro ao buscar fluxo de caixa:', err);
      setError(err.message || 'Erro ao carregar fluxo de caixa');
      toast.error('Erro ao carregar fluxo de caixa: ' + (err.message || 'Erro desconhecido'));
      setCashFlowData([]);
    } finally {
      setLoading(false);
    }
  };

  const refreshCashFlow = () => {
    console.log('useCashFlow - Atualizando fluxo de caixa...');
    fetchCashFlow();
  };

  useEffect(() => {
    fetchCashFlow();
  }, []);

  return {
    cashFlowData,
    loading,
    error,
    refreshCashFlow
  };
};
