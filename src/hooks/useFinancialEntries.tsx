
import { useState, useEffect } from 'react';
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from '@/components/Auth/AuthProvider';

export type FinancialEntry = {
  id: string;
  user_id: string;
  sale_id?: string;
  order_id?: string;
  client_id?: string;
  type: 'receivable' | 'payable';
  description: string;
  amount: number;
  due_date: string;
  payment_date?: string;
  payment_status: 'pending' | 'paid' | 'overdue' | 'cancelled';
  entry_number: string;
  notes?: string;
  account?: string;
  category?: string;
  created_at: string;
  updated_at: string;
};

export const useFinancialEntries = () => {
  const [entries, setEntries] = useState<FinancialEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user, companyInfo } = useAuth();

  const fetchEntries = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('useFinancialEntries - Iniciando busca de lançamentos financeiros...');
      
      if (!user || !companyInfo) {
        console.error('useFinancialEntries - Usuário ou empresa não encontrados');
        throw new Error('Usuário não autenticado ou empresa não encontrada');
      }
      
      console.log('useFinancialEntries - Buscando lançamentos da empresa:', companyInfo.id);

      const { data, error } = await supabase
        .from('financial_entries')
        .select('*')
        .eq('company_id', companyInfo.id) // Mudança aqui: usar company_id
        .order('due_date', { ascending: true });

      if (error) {
        console.error('useFinancialEntries - Erro do Supabase:', error);
        throw error;
      }

      console.log('useFinancialEntries - Dados recebidos do banco:', data);
      
      const entriesData = Array.isArray(data) ? data : [];
      console.log('useFinancialEntries - Total de lançamentos carregados:', entriesData.length);
      
      setEntries(entriesData);
      
    } catch (err: any) {
      console.error('useFinancialEntries - Erro ao buscar lançamentos:', err);
      setError(err.message || 'Erro ao carregar lançamentos financeiros');
      
      if (!err.message?.includes('não autenticado')) {
        toast.error('Erro ao carregar lançamentos: ' + (err.message || 'Erro desconhecido'));
      }
      
      setEntries([]);
    } finally {
      setLoading(false);
    }
  };

  const refreshEntries = () => {
    console.log('useFinancialEntries - Atualizando lista de lançamentos...');
    fetchEntries();
  };

  useEffect(() => {
    fetchEntries();
  }, [user, companyInfo]);

  return {
    entries,
    loading,
    error,
    refreshEntries
  };
};
