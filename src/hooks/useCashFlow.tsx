import { useState, useEffect } from 'react';
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";

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
  // Função responsável pela busca
  const fetchCashFlow = async (): Promise<CashFlowEntry[]> => {
    try {
      // Remover logs excessivos
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) throw new Error('Usuário não autenticado');
      // Busca com limite de registros (ex: 500) para acelerar
      const { data: entries, error: entriesError } = await supabase
        .from('financial_entries')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: true })
        .limit(500);

      if (entriesError) throw entriesError;

      // Contas a pagar pagas
      const { data: payables, error: payablesError } = await supabase
        .from('accounts_payable')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: true })
        .limit(500);

      if (payablesError) throw payablesError;

      // Construir fluxo de caixa como antes, mas mais eficiente
      const cashFlow: CashFlowEntry[] = [];
      let runningBalance = 0;

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
      cashFlow.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
      let balance = 0;
      cashFlow.forEach(item => {
        if (item.type === 'entrada') {
          balance += item.amount;
        } else {
          balance -= item.amount;
        }
        item.balance = balance;
      });
      return cashFlow;
    } catch (err: any) {
      throw new Error(err.message || 'Erro ao carregar fluxo de caixa');
    }
  };

  // React Query: cache de 3min
  const { data: cashFlowData = [], isLoading: loading, error, refetch } = useQuery({
    queryKey: ['cashFlow'],
    queryFn: fetchCashFlow,
    staleTime: 3 * 60 * 1000 // 3 minutos
  });

  return {
    cashFlowData,
    loading,
    error: error?.message || null,
    refreshCashFlow: refetch
  };
};
