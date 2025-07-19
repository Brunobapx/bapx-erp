import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface TrocaReportFilter {
  startDate?: string;
  endDate?: string;
  type: 'day' | 'month' | 'year' | 'custom';
}

export interface ProdutoMaisTrocado {
  produto_id: string;
  produto_nome: string;
  total_trocas: number;
  total_quantidade: number;
  custo_total: number;
}

export interface MotivoMaisUtilizado {
  motivo: string;
  quantidade: number;
  percentual: number;
}

export interface ClienteMaisTroca {
  cliente_id: string;
  cliente_nome: string;
  total_trocas: number;
  total_produtos: number;
  valor_perdido: number;
}

export interface TrocasReportData {
  resumo: {
    total_trocas: number;
    total_produtos_descartados: number;
    custo_total_perdas: number;
    media_perda_por_troca: number;
    trocas_periodo_anterior: number;
    crescimento_percentual: number;
  };
  produtos_mais_trocados: ProdutoMaisTrocado[];
  motivos_mais_utilizados: MotivoMaisUtilizado[];
  clientes_mais_trocam: ClienteMaisTroca[];
  evolucao_temporal: Array<{
    data: string;
    total_trocas: number;
    valor_perdido: number;
  }>;
}

export const useTrocasReports = () => {
  const [reportData, setReportData] = useState<TrocasReportData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generateReport = async (filters: TrocaReportFilter) => {
    setLoading(true);
    setError(null);
    
    try {
      const { startDate, endDate } = getDateRange(filters);
      
      // Buscar dados principais das trocas
      const { data: trocasData, error: trocasError } = await supabase
        .from('trocas')
        .select(`
          id,
          data_troca,
          cliente_id,
          clients(name),
          troca_itens(
            motivo,
            quantidade,
            produto_devolvido_id,
            products!troca_itens_produto_devolvido_id_fkey(
              id,
              name,
              cost
            )
          )
        `)
        .gte('data_troca', startDate)
        .lte('data_troca', endDate)
        .order('data_troca', { ascending: false });

      if (trocasError) throw trocasError;

      // Processar dados para relatório
      const processedData = await processReportData(trocasData, filters);
      setReportData(processedData);
      
    } catch (err: any) {
      console.error('Erro ao gerar relatório:', err);
      setError(err.message);
      toast.error('Erro ao gerar relatório de trocas');
    } finally {
      setLoading(false);
    }
  };

  const getDateRange = (filters: TrocaReportFilter) => {
    const now = new Date();
    let startDate: string;
    let endDate: string;

    switch (filters.type) {
      case 'day':
        startDate = now.toISOString().split('T')[0];
        endDate = startDate;
        break;
      case 'month':
        const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
        const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        startDate = firstDay.toISOString().split('T')[0];
        endDate = lastDay.toISOString().split('T')[0];
        break;
      case 'year':
        startDate = `${now.getFullYear()}-01-01`;
        endDate = `${now.getFullYear()}-12-31`;
        break;
      case 'custom':
        startDate = filters.startDate || startDate;
        endDate = filters.endDate || endDate;
        break;
      default:
        startDate = now.toISOString().split('T')[0];
        endDate = startDate;
    }

    return { startDate, endDate };
  };

  const processReportData = async (trocasData: any[], filters: TrocaReportFilter): Promise<TrocasReportData> => {
    // Resumo geral
    const totalTrocas = trocasData.length;
    const totalProdutosDescartados = trocasData.reduce((acc, troca) => {
      return acc + (troca.troca_itens?.reduce((itemAcc: number, item: any) => itemAcc + item.quantidade, 0) || 0);
    }, 0);

    const custoTotalPerdas = trocasData.reduce((acc, troca) => {
      const custoTroca = troca.troca_itens?.reduce((itemAcc: number, item: any) => {
        const custo = item.products?.cost || 0;
        return itemAcc + (custo * item.quantidade);
      }, 0) || 0;
      return acc + custoTroca;
    }, 0);

    const mediaPerdaPorTroca = totalTrocas > 0 ? custoTotalPerdas / totalTrocas : 0;

    // Buscar dados do período anterior para comparação
    const { startDate: currentStart, endDate: currentEnd } = getDateRange(filters);
    const startDateObj = new Date(currentStart);
    const endDateObj = new Date(currentEnd);
    
    let trocasPeriodoAnterior = 0;
    let crescimentoPercentual = 0;
    
    if (!isNaN(startDateObj.getTime()) && !isNaN(endDateObj.getTime())) {
      const periodoDias = Math.abs(endDateObj.getTime() - startDateObj.getTime()) / (1000 * 60 * 60 * 24);
      const dataInicioAnterior = new Date(startDateObj);
      dataInicioAnterior.setDate(dataInicioAnterior.getDate() - periodoDias);
      const dataFimAnterior = new Date(startDateObj);
      dataFimAnterior.setDate(dataFimAnterior.getDate() - 1);

      const { data: trocasAnteriores } = await supabase
        .from('trocas')
        .select('id')
        .gte('data_troca', dataInicioAnterior.toISOString().split('T')[0])
        .lte('data_troca', dataFimAnterior.toISOString().split('T')[0]);

      trocasPeriodoAnterior = trocasAnteriores?.length || 0;
      crescimentoPercentual = trocasPeriodoAnterior > 0 
        ? ((totalTrocas - trocasPeriodoAnterior) / trocasPeriodoAnterior) * 100 
        : 0;
    }

    // Produtos mais trocados
    const produtosMap = new Map<string, ProdutoMaisTrocado>();
    trocasData.forEach(troca => {
      troca.troca_itens?.forEach((item: any) => {
        const produtoId = item.produto_devolvido_id;
        const produtoNome = item.products?.name || 'Produto não encontrado';
        const custo = item.products?.cost || 0;
        
        if (produtosMap.has(produtoId)) {
          const existing = produtosMap.get(produtoId)!;
          existing.total_trocas += 1;
          existing.total_quantidade += item.quantidade;
          existing.custo_total += custo * item.quantidade;
        } else {
          produtosMap.set(produtoId, {
            produto_id: produtoId,
            produto_nome: produtoNome,
            total_trocas: 1,
            total_quantidade: item.quantidade,
            custo_total: custo * item.quantidade
          });
        }
      });
    });

    const produtosMaisTrocados = Array.from(produtosMap.values())
      .sort((a, b) => b.total_trocas - a.total_trocas)
      .slice(0, 10);

    // Motivos mais utilizados
    const motivosMap = new Map<string, number>();
    let totalMotivos = 0;
    
    trocasData.forEach(troca => {
      troca.troca_itens?.forEach((item: any) => {
        const motivo = item.motivo || 'Não informado';
        motivosMap.set(motivo, (motivosMap.get(motivo) || 0) + 1);
        totalMotivos++;
      });
    });

    const motivosMaisUtilizados = Array.from(motivosMap.entries())
      .map(([motivo, quantidade]) => ({
        motivo,
        quantidade,
        percentual: (quantidade / totalMotivos) * 100
      }))
      .sort((a, b) => b.quantidade - a.quantidade);

    // Clientes que mais trocam
    const clientesMap = new Map<string, ClienteMaisTroca>();
    trocasData.forEach(troca => {
      const clienteId = troca.cliente_id;
      const clienteNome = troca.clients?.name || 'Cliente não encontrado';
      const totalProdutos = troca.troca_itens?.reduce((acc: number, item: any) => acc + item.quantidade, 0) || 0;
      const valorPerdido = troca.troca_itens?.reduce((acc: number, item: any) => {
        const custo = item.products?.cost || 0;
        return acc + (custo * item.quantidade);
      }, 0) || 0;
      
      if (clientesMap.has(clienteId)) {
        const existing = clientesMap.get(clienteId)!;
        existing.total_trocas += 1;
        existing.total_produtos += totalProdutos;
        existing.valor_perdido += valorPerdido;
      } else {
        clientesMap.set(clienteId, {
          cliente_id: clienteId,
          cliente_nome: clienteNome,
          total_trocas: 1,
          total_produtos: totalProdutos,
          valor_perdido: valorPerdido
        });
      }
    });

    const clientesMaisTrocam = Array.from(clientesMap.values())
      .sort((a, b) => b.total_trocas - a.total_trocas)
      .slice(0, 10);

    // Evolução temporal (agrupado por dia)
    const evolucaoMap = new Map<string, { total_trocas: number; valor_perdido: number }>();
    trocasData.forEach(troca => {
      const data = troca.data_troca.split('T')[0];
      const valorPerdido = troca.troca_itens?.reduce((acc: number, item: any) => {
        const custo = item.products?.cost || 0;
        return acc + (custo * item.quantidade);
      }, 0) || 0;
      
      if (evolucaoMap.has(data)) {
        const existing = evolucaoMap.get(data)!;
        existing.total_trocas += 1;
        existing.valor_perdido += valorPerdido;
      } else {
        evolucaoMap.set(data, {
          total_trocas: 1,
          valor_perdido: valorPerdido
        });
      }
    });

    const evolucaoTemporal = Array.from(evolucaoMap.entries())
      .map(([data, valores]) => ({
        data,
        total_trocas: valores.total_trocas,
        valor_perdido: valores.valor_perdido
      }))
      .sort((a, b) => a.data.localeCompare(b.data));

    return {
      resumo: {
        total_trocas: totalTrocas,
        total_produtos_descartados: totalProdutosDescartados,
        custo_total_perdas: custoTotalPerdas,
        media_perda_por_troca: mediaPerdaPorTroca,
        trocas_periodo_anterior: trocasPeriodoAnterior,
        crescimento_percentual: crescimentoPercentual
      },
      produtos_mais_trocados: produtosMaisTrocados,
      motivos_mais_utilizados: motivosMaisUtilizados,
      clientes_mais_trocam: clientesMaisTrocam,
      evolucao_temporal: evolucaoTemporal
    };
  };

  return {
    reportData,
    loading,
    error,
    generateReport
  };
};