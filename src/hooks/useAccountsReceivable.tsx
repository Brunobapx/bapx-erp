
import { useState, useEffect } from 'react';
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";

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
  invoice_number?: string; // Adicionado
};

export const useAccountsReceivable = () => {
  const fetchAccountsReceivable = async (): Promise<AccountReceivable[]> => {
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) throw new Error('Usuário não autenticado');
      const { data, error } = await supabase
        .from('financial_entries')
        .select(`
          *,
          clients(name)
        `)
        .eq('user_id', user.id)
        .eq('type', 'receivable')
        .order('due_date', { ascending: true })
        .limit(500);
      if (error) throw error;
      const today = new Date().toISOString().split('T')[0];
      return (data || []).map(entry => {
        let status: 'pendente' | 'recebido' | 'vencido' = 'pendente';
        if (entry.payment_status === 'paid') status = 'recebido';
        else if (entry.due_date < today) status = 'vencido';
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
          payment_date: entry.payment_date,
          invoice_number: entry.invoice_number || '', // Puxa do banco
        };
      });
    } catch (err: any) {
      throw new Error(err.message || 'Erro ao carregar contas a receber');
    }
  };

  const { data: accountsReceivable = [], isLoading: loading, error, refetch } = useQuery({
    queryKey: ['accountsReceivable'],
    queryFn: fetchAccountsReceivable,
    staleTime: 3 * 60 * 1000 // 3 minutos
  });

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
      refetch();
    } catch (error: any) {
      console.error('Erro ao confirmar recebimento:', error);
      toast.error('Erro ao confirmar recebimento');
    }
  };

  return {
    accountsReceivable,
    loading,
    error: error?.message || null,
    confirmReceivable,
    refreshReceivables: refetch
  };
};
