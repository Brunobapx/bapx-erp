import { useState, useEffect } from 'react';
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/components/Auth/AuthProvider";

export type Troca = {
  id: string;
  user_id: string;
  cliente_id: string;
  produto_devolvido_id: string;
  produto_novo_id: string;
  quantidade: number;
  motivo: string;
  data_troca: string;
  responsavel: string;
  observacoes?: string;
  created_at: string;
  updated_at: string;
  // Relacionamentos
  cliente?: {
    id: string;
    name: string;
  };
  produto_devolvido?: {
    id: string;
    name: string;
    cost?: number;
  };
  produto_novo?: {
    id: string;
    name: string;
    cost?: number;
  };
};

export type NovoTrocaData = {
  cliente_id: string;
  produto_devolvido_id: string;
  produto_novo_id: string;
  quantidade: number;
  motivo: string;
  responsavel: string;
  observacoes?: string;
};

export const useTrocas = () => {
  const [trocas, setTrocas] = useState<Troca[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const { user } = useAuth();

  useEffect(() => {
    const fetchTrocas = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const { data: { user: authUser }, error: userError } = await supabase.auth.getUser();
        
        if (userError || !authUser) {
          throw new Error('Usuário não autenticado');
        }

        const { data, error } = await supabase
          .from('trocas')
          .select(`
            *,
            cliente:clients!cliente_id(
              id,
              name
            ),
            produto_devolvido:products!produto_devolvido_id(
              id,
              name,
              cost
            ),
            produto_novo:products!produto_novo_id(
              id,
              name,
              cost
            )
          `)
          .order('data_troca', { ascending: false });
        
        if (error) throw error;
        
        setTrocas(data || []);
      } catch (error: any) {
        console.error('Erro ao carregar trocas:', error);
        setError(error.message || 'Erro ao carregar trocas');
        toast.error('Erro ao carregar trocas');
      } finally {
        setLoading(false);
      }
    };

    fetchTrocas();
  }, [refreshTrigger]);

  const refreshTrocas = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  const criarTroca = async (data: NovoTrocaData) => {
    try {
      if (!user) {
        throw new Error('Usuário não autenticado');
      }

      console.log('[CREATE_TROCA] Iniciando processo de troca:', data);

      // Verificar estoque do produto novo
      const { data: produtoNovo, error: produtoError } = await supabase
        .from('products')
        .select('id, name, stock, cost')
        .eq('id', data.produto_novo_id)
        .single();

      if (produtoError || !produtoNovo) {
        throw new Error('Produto novo não encontrado');
      }

      if ((produtoNovo.stock || 0) < data.quantidade) {
        throw new Error(`Estoque insuficiente. Disponível: ${produtoNovo.stock || 0}, Solicitado: ${data.quantidade}`);
      }

      // Buscar dados do produto devolvido para o cálculo da perda
      const { data: produtoDevolvido, error: produtoDevError } = await supabase
        .from('products')
        .select('id, name, cost')
        .eq('id', data.produto_devolvido_id)
        .single();

      if (produtoDevError || !produtoDevolvido) {
        throw new Error('Produto devolvido não encontrado');
      }

      // 1. Criar a troca
      const { data: trocaCriada, error: trocaError } = await supabase
        .from('trocas')
        .insert({
          user_id: user.id,
          ...data,
          data_troca: new Date().toISOString()
        })
        .select()
        .single();

      if (trocaError) throw trocaError;

      console.log('[CREATE_TROCA] Troca criada:', trocaCriada);

      // 2. Dar baixa no estoque do produto novo
      const novoEstoque = (produtoNovo.stock || 0) - data.quantidade;
      const { error: estoqueError } = await supabase
        .from('products')
        .update({ 
          stock: novoEstoque,
          updated_at: new Date().toISOString()
        })
        .eq('id', data.produto_novo_id);

      if (estoqueError) {
        console.error('[CREATE_TROCA] Erro ao atualizar estoque:', estoqueError);
        // Tentar reverter a troca criada
        await supabase.from('trocas').delete().eq('id', trocaCriada.id);
        throw new Error('Erro ao atualizar estoque do produto');
      }

      console.log('[CREATE_TROCA] Estoque atualizado:', { 
        produto: produtoNovo.name, 
        estoque_anterior: produtoNovo.stock, 
        estoque_novo: novoEstoque 
      });

      // 3. Registrar a perda
      const custoEstimado = (produtoDevolvido.cost || 0) * data.quantidade;
      const { error: perdaError } = await supabase
        .from('perdas')
        .insert({
          user_id: user.id,
          produto_id: data.produto_devolvido_id,
          quantidade: data.quantidade,
          motivo: `Troca - ${data.motivo}`,
          custo_estimado: custoEstimado,
          referencia_troca_id: trocaCriada.id,
          observacoes: `Produto descartado por troca. ${data.observacoes || ''}`
        });

      if (perdaError) {
        console.error('[CREATE_TROCA] Erro ao registrar perda:', perdaError);
        // Não falhar a operação por erro na perda, apenas logar
      }

      console.log('[CREATE_TROCA] Perda registrada:', { 
        produto: produtoDevolvido.name, 
        quantidade: data.quantidade, 
        custo: custoEstimado 
      });

      toast.success('Troca registrada com sucesso');
      refreshTrocas();
      return trocaCriada;

    } catch (error: any) {
      console.error('[CREATE_TROCA] Erro:', error);
      toast.error('Erro ao registrar troca: ' + error.message);
      throw error;
    }
  };

  const obterEstatisticas = async (dataInicio?: string, dataFim?: string) => {
    try {
      let query = supabase
        .from('trocas')
        .select(`
          quantidade,
          motivo,
          produto_devolvido:products!produto_devolvido_id(cost)
        `);

      if (dataInicio) {
        query = query.gte('data_troca', dataInicio);
      }
      if (dataFim) {
        query = query.lte('data_troca', dataFim);
      }

      const { data, error } = await query;
      
      if (error) throw error;

      const totalTrocas = data?.length || 0;
      const totalProdutosDescartados = data?.reduce((acc, troca) => acc + troca.quantidade, 0) || 0;
      const custoEstimadoPerdas = data?.reduce((acc, troca) => {
        const custo = (troca.produto_devolvido as any)?.cost || 0;
        return acc + (custo * troca.quantidade);
      }, 0) || 0;

      // Agrupar por motivo
      const motivosMap = new Map();
      data?.forEach(troca => {
        const motivo = troca.motivo;
        if (motivosMap.has(motivo)) {
          motivosMap.set(motivo, motivosMap.get(motivo) + troca.quantidade);
        } else {
          motivosMap.set(motivo, troca.quantidade);
        }
      });

      const motivosEstatisticas = Array.from(motivosMap.entries()).map(([motivo, quantidade]) => ({
        motivo,
        quantidade
      }));

      return {
        totalTrocas,
        totalProdutosDescartados,
        custoEstimadoPerdas,
        motivosEstatisticas
      };

    } catch (error: any) {
      console.error('Erro ao obter estatísticas:', error);
      throw error;
    }
  };

  return {
    trocas,
    loading,
    error,
    refreshTrocas,
    criarTroca,
    obterEstatisticas
  };
};