import { useState, useEffect } from 'react';
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/components/Auth/AuthProvider";

export type Perda = {
  id: string;
  user_id: string;
  produto_id: string;
  quantidade: number;
  motivo: string;
  custo_estimado?: number;
  data_perda: string;
  referencia_troca_id?: string;
  observacoes?: string;
  created_at: string;
  updated_at: string;
  // Relacionamentos
  produto?: {
    id: string;
    name: string;
    cost?: number;
  };
  troca?: {
    id: string;
    responsavel: string;
  };
};

export const usePerdas = () => {
  const [perdas, setPerdas] = useState<Perda[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const { user } = useAuth();

  useEffect(() => {
    const fetchPerdas = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const { data: { user: authUser }, error: userError } = await supabase.auth.getUser();
        
        if (userError || !authUser) {
          throw new Error('Usuário não autenticado');
        }

        const { data, error } = await supabase
          .from('perdas')
          .select(`
            *,
            produto:products!produto_id(
              id,
              name,
              cost
            ),
            troca:trocas!referencia_troca_id(
              id,
              responsavel
            )
          `)
          .order('data_perda', { ascending: false });
        
        if (error) throw error;
        
        setPerdas(data || []);
      } catch (error: any) {
        console.error('Erro ao carregar perdas:', error);
        setError(error.message || 'Erro ao carregar perdas');
        toast.error('Erro ao carregar perdas');
      } finally {
        setLoading(false);
      }
    };

    fetchPerdas();
  }, [refreshTrigger]);

  const refreshPerdas = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  const obterRelatorioPerdas = async (dataInicio?: string, dataFim?: string) => {
    try {
      let query = supabase
        .from('perdas')
        .select(`
          *,
          produto:products!produto_id(
            id,
            name,
            cost
          )
        `);

      if (dataInicio) {
        query = query.gte('data_perda', dataInicio);
      }
      if (dataFim) {
        query = query.lte('data_perda', dataFim);
      }

      const { data, error } = await query.order('data_perda', { ascending: false });
      
      if (error) throw error;

      const totalPerdas = data?.length || 0;
      const totalQuantidade = data?.reduce((acc, perda) => acc + perda.quantidade, 0) || 0;
      const custoTotal = data?.reduce((acc, perda) => acc + (perda.custo_estimado || 0), 0) || 0;

      // Agrupar por motivo
      const motivosMap = new Map();
      data?.forEach(perda => {
        const motivo = perda.motivo;
        if (motivosMap.has(motivo)) {
          const existing = motivosMap.get(motivo);
          motivosMap.set(motivo, {
            quantidade: existing.quantidade + perda.quantidade,
            custo: existing.custo + (perda.custo_estimado || 0)
          });
        } else {
          motivosMap.set(motivo, {
            quantidade: perda.quantidade,
            custo: perda.custo_estimado || 0
          });
        }
      });

      const motivosEstatisticas = Array.from(motivosMap.entries()).map(([motivo, stats]) => ({
        motivo,
        ...stats
      }));

      // Agrupar por produto
      const produtosMap = new Map();
      data?.forEach(perda => {
        const produtoId = perda.produto_id;
        const produtoNome = perda.produto?.name || 'Produto não identificado';
        
        if (produtosMap.has(produtoId)) {
          const existing = produtosMap.get(produtoId);
          produtosMap.set(produtoId, {
            nome: produtoNome,
            quantidade: existing.quantidade + perda.quantidade,
            custo: existing.custo + (perda.custo_estimado || 0)
          });
        } else {
          produtosMap.set(produtoId, {
            nome: produtoNome,
            quantidade: perda.quantidade,
            custo: perda.custo_estimado || 0
          });
        }
      });

      const produtosEstatisticas = Array.from(produtosMap.entries()).map(([id, stats]) => ({
        produto_id: id,
        ...stats
      }));

      return {
        perdas: data || [],
        totalPerdas,
        totalQuantidade,
        custoTotal,
        motivosEstatisticas,
        produtosEstatisticas
      };

    } catch (error: any) {
      console.error('Erro ao obter relatório de perdas:', error);
      throw error;
    }
  };

  return {
    perdas,
    loading,
    error,
    refreshPerdas,
    obterRelatorioPerdas
  };
};