
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

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

  const fetchTransacoes = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado");
      
      console.log('Buscando transações do extrato para usuário:', user.id);
      
      const { data, error } = await supabase
        .from("extrato_bancario_importado")
        .select("*")
        .eq("user_id", user.id)
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
  }, []);

  return {
    transacoes,
    loading,
    error,
    refreshExtrato: fetchTransacoes,
  };
}
