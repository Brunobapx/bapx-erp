import { useState, useEffect } from 'react';
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/components/Auth/AuthProvider";

export type TrocaItem = {
  id: string;
  troca_id: string;
  produto_devolvido_id: string;
  produto_novo_id: string;
  quantidade: number;
  observacoes_item?: string;
  // Relacionamentos
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

export type Troca = {
  id: string;
  numero_troca: string;
  user_id: string;
  cliente_id: string;
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
  troca_itens?: TrocaItem[];
};

export type NovoTrocaItem = {
  produto_devolvido_id: string;
  produto_novo_id: string;
  quantidade: number;
  observacoes_item?: string;
};

export type NovoTrocaData = {
  cliente_id: string;
  motivo: string;
  responsavel: string;
  observacoes?: string;
  itens: NovoTrocaItem[];
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
            troca_itens(
              id,
              produto_devolvido_id,
              produto_novo_id,
              quantidade,
              observacoes_item,
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

      if (!data.itens || data.itens.length === 0) {
        throw new Error('É necessário adicionar pelo menos um item à troca');
      }

      console.log('[CREATE_TROCA] Iniciando processo de troca:', data);

      // Verificar estoque de todos os produtos novos
      for (const item of data.itens) {
        const { data: produto, error: produtoError } = await supabase
          .from('products')
          .select('id, name, stock')
          .eq('id', item.produto_novo_id)
          .single();

        if (produtoError || !produto) {
          throw new Error(`Produto não encontrado: ${item.produto_novo_id}`);
        }

        if ((produto.stock || 0) < item.quantidade) {
          throw new Error(`Estoque insuficiente para ${produto.name}. Disponível: ${produto.stock || 0}, Solicitado: ${item.quantidade}`);
        }
      }

      // 1. Criar a troca principal
      const { data: trocaCriada, error: trocaError } = await supabase
        .from('trocas')
        .insert({
          user_id: user.id,
          cliente_id: data.cliente_id,
          motivo: data.motivo || '',
          responsavel: data.responsavel || '',
          observacoes: data.observacoes || null,
          data_troca: new Date().toISOString(),
          numero_troca: '' // Será gerado pelo trigger
        })
        .select()
        .single();

      if (trocaError) throw trocaError;

      console.log('[CREATE_TROCA] Troca criada:', trocaCriada);

      // 2. Processar cada item da troca
      for (const item of data.itens) {
        // Buscar dados dos produtos
        const { data: produtoNovo, error: produtoNovoError } = await supabase
          .from('products')
          .select('id, name, stock, cost')
          .eq('id', item.produto_novo_id)
          .single();

        const { data: produtoDevolvido, error: produtoDevError } = await supabase
          .from('products')
          .select('id, name, cost')
          .eq('id', item.produto_devolvido_id)
          .single();

        if (produtoNovoError || !produtoNovo || produtoDevError || !produtoDevolvido) {
          throw new Error('Erro ao buscar dados dos produtos');
        }

        // Criar item da troca
        const { error: itemError } = await supabase
          .from('troca_itens')
          .insert({
            troca_id: trocaCriada.id,
            produto_devolvido_id: item.produto_devolvido_id,
            produto_novo_id: item.produto_novo_id,
            quantidade: item.quantidade,
            observacoes_item: item.observacoes_item
          });

        if (itemError) throw itemError;

        // Dar baixa no estoque do produto novo
        const novoEstoque = (produtoNovo.stock || 0) - item.quantidade;
        const { error: estoqueError } = await supabase
          .from('products')
          .update({ 
            stock: novoEstoque,
            updated_at: new Date().toISOString()
          })
          .eq('id', item.produto_novo_id);

        if (estoqueError) {
          console.error('[CREATE_TROCA] Erro ao atualizar estoque:', estoqueError);
          throw new Error(`Erro ao atualizar estoque do produto ${produtoNovo.name}`);
        }

        // Registrar a perda
        const custoEstimado = (produtoDevolvido.cost || 0) * item.quantidade;
        const { error: perdaError } = await supabase
          .from('perdas')
          .insert({
            user_id: user.id,
            produto_id: item.produto_devolvido_id,
            quantidade: item.quantidade,
            motivo: `Troca - ${data.motivo}`,
            custo_estimado: custoEstimado,
            referencia_troca_id: trocaCriada.id,
            observacoes: `Produto descartado por troca. ${item.observacoes_item || ''}`
          });

        if (perdaError) {
          console.error('[CREATE_TROCA] Erro ao registrar perda:', perdaError);
        }
      }

      toast.success(`Troca ${trocaCriada.numero_troca} registrada com sucesso`);
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
          id,
          troca_itens(
            quantidade,
            produto_devolvido:products!produto_devolvido_id(cost)
          ),
          motivo
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
      let totalProdutosDescartados = 0;
      let custoEstimadoPerdas = 0;
      const motivosMap = new Map();

      data?.forEach(troca => {
        const motivo = troca.motivo;
        let quantidadetroca = 0;

        troca.troca_itens?.forEach(item => {
          quantidadetroca += item.quantidade;
          totalProdutosDescartados += item.quantidade;
          const custo = (item.produto_devolvido as any)?.cost || 0;
          custoEstimadoPerdas += custo * item.quantidade;
        });

        if (motivosMap.has(motivo)) {
          motivosMap.set(motivo, motivosMap.get(motivo) + quantidadetroca);
        } else {
          motivosMap.set(motivo, quantidadetroca);
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