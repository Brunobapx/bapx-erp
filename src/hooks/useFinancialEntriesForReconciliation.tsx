
import { useState, useEffect } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from '@/components/Auth/AuthProvider';

export type FinancialEntryForReconciliation = {
  id: string;
  type: 'receivable' | 'payable';
  description: string;
  amount: number;
  due_date: string;
  payment_status: string;
  entry_number: string;
};

export const useFinancialEntriesForReconciliation = () => {
  const [entries, setEntries] = useState<FinancialEntryForReconciliation[]>([]);
  const [loading, setLoading] = useState(true);
  const { user, companyInfo } = useAuth();

  const fetchEntries = async () => {
    try {
      if (!user || !companyInfo) {
        setEntries([]);
        setLoading(false);
        return;
      }

      // Buscar lançamentos financeiros da empresa
      const { data: financialEntries, error: financialError } = await supabase
        .from('financial_entries')
        .select('id, type, description, amount, due_date, payment_status, entry_number')
        .eq('company_id', companyInfo.id)
        .eq('payment_status', 'pending')
        .order('due_date', { ascending: false });

      if (financialError) throw financialError;

      // Buscar contas a pagar da empresa
      const { data: payableEntries, error: payableError } = await supabase
        .from('accounts_payable')
        .select('id, description, amount, due_date, status, supplier_name')
        .eq('company_id', companyInfo.id)
        .eq('status', 'pending')
        .order('due_date', { ascending: false });

      if (payableError) throw payableError;

      const allEntries: FinancialEntryForReconciliation[] = [];

      // Adicionar lançamentos financeiros
      if (financialEntries) {
        financialEntries.forEach(entry => {
          allEntries.push({
            id: entry.id,
            type: entry.type,
            description: entry.description,
            amount: Number(entry.amount),
            due_date: entry.due_date,
            payment_status: entry.payment_status,
            entry_number: entry.entry_number
          });
        });
      }

      // Adicionar contas a pagar
      if (payableEntries) {
        payableEntries.forEach(entry => {
          allEntries.push({
            id: entry.id,
            type: 'payable',
            description: `${entry.supplier_name} - ${entry.description}`,
            amount: Number(entry.amount),
            due_date: entry.due_date,
            payment_status: entry.status,
            entry_number: entry.id.substring(0, 8) // Usar parte do ID como número
          });
        });
      }

      setEntries(allEntries);
    } catch (error) {
      console.error('Erro ao buscar lançamentos para conciliação:', error);
      setEntries([]);
    } finally {
      setLoading(false);
    }
  };

  const findSimilarEntries = (valor: number, data: string, tipo: string) => {
    const valorAbs = Math.abs(valor);
    const tipoEsperado = tipo === 'credito' ? 'receivable' : 'payable';
    
    return entries.filter(entry => {
      const diferencaValor = Math.abs(entry.amount - valorAbs);
      const toleranciaValor = valorAbs * 0.05; // 5% de tolerância
      
      const valorCompativel = diferencaValor <= toleranciaValor;
      const tipoCompativel = entry.type === tipoEsperado;
      
      return valorCompativel && tipoCompativel;
    }).slice(0, 5); // Mostrar apenas os 5 primeiros
  };

  useEffect(() => {
    fetchEntries();
  }, [user, companyInfo]);

  return {
    entries,
    loading,
    findSimilarEntries,
    refreshEntries: fetchEntries
  };
};
