
import { useState, useEffect } from "react";
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
};

export function useFinancialEntriesForReconciliation() {
  const [entries, setEntries] = useState<FinancialEntryForReconciliation[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchEntries = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado");

      const { data, error } = await supabase
        .from("financial_entries")
        .select("id, description, amount, due_date, type, payment_status, entry_number, client_id")
        .eq("user_id", user.id)
        .eq("payment_status", "pending")
        .order("due_date", { ascending: false });

      if (error) throw error;

      setEntries(data || []);
    } catch (err: any) {
      setError(err.message);
      setEntries([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEntries();
  }, []);

  const findSimilarEntries = (valor: number, data: string, tipo: string) => {
    const targetDate = new Date(data);
    const toleranceDays = 5; // 5 dias de tolerância
    const toleranceAmount = 0.01; // 1 centavo de tolerância
    
    return entries.filter(entry => {
      const entryDate = new Date(entry.due_date);
      const daysDiff = Math.abs((targetDate.getTime() - entryDate.getTime()) / (1000 * 60 * 60 * 24));
      const amountDiff = Math.abs(Math.abs(valor) - entry.amount);
      
      // Verificar se o tipo é compatível (crédito = receivable, débito = payable)
      const typeMatch = (tipo === 'credito' && entry.type === 'receivable') ||
                       (tipo === 'debito' && entry.type === 'payable');
      
      return daysDiff <= toleranceDays && amountDiff <= toleranceAmount && typeMatch;
    });
  };

  return {
    entries,
    loading,
    error,
    refreshEntries: fetchEntries,
    findSimilarEntries,
  };
}
