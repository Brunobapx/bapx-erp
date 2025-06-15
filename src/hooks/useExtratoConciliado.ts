
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export type ExtratoTransacao = {
  id: string,
  data: string,
  descricao: string,
  valor: number,
  tipo: string,
  status: string,
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
      const { data, error } = await supabase
        .from("extrato_bancario_importado")
        .select("*")
        .eq("user_id", user.id)
        .order("data", { ascending: false });
      if (error) throw error;
      setTransacoes(data || []);
    } catch (err: any) {
      setError(err.message);
      setTransacoes([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchTransacoes(); }, []);

  return {
    transacoes,
    loading,
    error,
    refreshExtrato: fetchTransacoes,
  };
}
