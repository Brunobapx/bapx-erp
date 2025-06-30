
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from '@/components/Auth/AuthProvider';

export interface ExtratoTransacao {
  id: string;
  data: string;
  descricao: string;
  valor: number;
  tipo: "credito" | "debito";
  status: "nao_conciliado" | "conciliado" | "em_processamento";
  arquivo_origem?: string;
}

export function useExtratoConciliado() {
  const [transacoes, setTransacoes] = useState<ExtratoTransacao[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user, companyInfo } = useAuth();

  const fetchExtrato = async () => {
    try {
      setLoading(true);
      setError(null);

      if (!user || !companyInfo) {
        setTransacoes([]);
        setLoading(false);
        return;
      }

      console.log('Buscando extrato bancário da empresa:', companyInfo.id);

      const { data, error } = await supabase
        .from("extrato_bancario_importado")
        .select("*")
        .eq("user_id", user.id) // Mantém user_id pois é quem importou o extrato
        .order("data", { ascending: false });

      if (error) {
        console.error("Erro ao buscar extrato:", error);
        throw error;
      }

      const transacoesFormatadas: ExtratoTransacao[] = (data || []).map(item => ({
        id: item.id,
        data: item.data,
        descricao: item.descricao,
        valor: Number(item.valor),
        tipo: item.tipo as "credito" | "debito",
        status: item.status as "nao_conciliado" | "conciliado" | "em_processamento",
        arquivo_origem: item.arquivo_origem
      }));

      console.log(`Extrato carregado: ${transacoesFormatadas.length} transações`);
      setTransacoes(transacoesFormatadas);

    } catch (err: any) {
      console.error("Erro no useExtratoConciliado:", err);
      setError(err.message || "Erro ao carregar extrato bancário");
      setTransacoes([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExtrato();
  }, [user, companyInfo]);

  return {
    transacoes,
    loading,
    error,
    refreshExtrato: fetchExtrato
  };
}
