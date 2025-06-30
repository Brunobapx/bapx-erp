
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/components/Auth/AuthProvider";

export type ExtratoTransacao = {
  id: string,
  data: string,
  descricao: string,
  valor: number,
  tipo: string,
  status: string,
  user_id: string,
  company_id?: string,
  arquivo_origem?: string,
  created_at: string,
};

export function useExtratoConciliado() {
  const [transacoes, setTransacoes] = useState<ExtratoTransacao[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user, companyInfo } = useAuth();

  const fetchTransacoes = async () => {
    setLoading(true);
    setError(null);
    try {
      if (!user || !companyInfo) throw new Error("Usuário não autenticado");
      
      console.log('Buscando transações do extrato para empresa:', companyInfo.id);
      
      const { data, error } = await supabase
        .from("extrato_bancario_importado")
        .select("*")
        .eq("user_id", user.id) // Mantém user_id pois extrato é por usuário que importou
        .order("data", { ascending: false });
      
      if (error) {
        console.error('Erro ao buscar transações:', error);
        throw error;
      }
      
      console.log('Transações encontradas:', data?.length || 0);
      setTransacoes(data || []);
    } catch (err: any) {
      console.error('Erro no fetchTransacoes:', err);
      setError(err.message);
      setTransacoes([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { 
    fetchTransacoes(); 
  }, [user, companyInfo]);

  return {
    transacoes,
    loading,
    error,
    refreshExtrato: fetchTransacoes,
  };
}
