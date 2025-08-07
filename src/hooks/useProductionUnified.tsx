import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAuth } from '@/components/Auth/AuthProvider';
import type { 
  ProductionItem, 
  InternalProductionItem, 
  OrderProductionItem, 
  ProductionStatus, 
  ProductionFormData, 
  ProductionFilters, 
  ProductionSortOptions 
} from '@/types/production';

export interface UseProductionOptions {
  autoRefresh?: boolean;
  filters?: ProductionFilters;
  sorting?: ProductionSortOptions;
}

export const useProductionUnified = (options: UseProductionOptions = {}) => {
  const [productions, setProductions] = useState<ProductionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const lastErrorRef = useRef<{ message: string; time: number } | null>(null);
  const inFlightRef = useRef(false);
  const lastLoadRef = useRef(0);

  const showErrorOnce = (msg: string) => {
    const now = Date.now();
    const prev = lastErrorRef.current;
    // Dedup por mensagem e janela de 60s
    if (!prev || prev.message !== msg || now - prev.time > 60000) {
      toast.error(msg, { id: 'production-load-error' });
      lastErrorRef.current = { message: msg, time: now };
    }
  };

  const { user } = useAuth();

  // Função principal para carregar produções
  const loadProductions = useCallback(async (customFilters?: ProductionFilters) => {
    // Throttle: evita múltiplas chamadas em sequência (5s)
    const nowTs = Date.now();
    if (nowTs - lastLoadRef.current < 5000) return;
    lastLoadRef.current = nowTs;
    if (inFlightRef.current) return;
    inFlightRef.current = true;
    try {
      setLoading(true);
      setError(null);

      if (!user) {
        throw new Error('Usuário não autenticado');
      }

      console.log('[useProductionUnified] Carregando produções para usuário:', user.id);

      // Buscar todas as produções
      let query = supabase
        .from('production')
        .select('*');

      // Aplicar filtros
      const activeFilters = customFilters || options.filters;
      if (activeFilters?.status) {
        query = query.eq('status', activeFilters.status);
      }

      if (activeFilters?.product) {
        query = query.ilike('product_name', `%${activeFilters.product}%`);
      }

      if (activeFilters?.production_type && activeFilters.production_type !== 'all') {
        if (activeFilters.production_type === 'internal') {
          query = query.is('order_item_id', null);
        } else {
          query = query.not('order_item_id', 'is', null);
        }
      }

      if (activeFilters?.dateRange) {
        query = query
          .gte('created_at', activeFilters.dateRange.start.toISOString())
          .lte('created_at', activeFilters.dateRange.end.toISOString());
      }

      // Aplicar ordenação
      const sorting = options.sorting || { field: 'created_at', direction: 'desc' };
      query = query.order(sorting.field, { ascending: sorting.direction === 'asc' });

      const { data: rawProductions, error: fetchError } = await query;

      if (fetchError) throw fetchError;

      // Enriquecer dados das produções com informações dos pedidos
      const enrichedProductions: ProductionItem[] = [];

      for (const prod of rawProductions || []) {
        if (prod.order_item_id) {
          // Produção de pedido - buscar dados do pedido
          try {
            const { data: orderItem, error: itemError } = await supabase
              .from('order_items')
              .select('order_id')
              .eq('id', prod.order_item_id)
              .single();

            if (!itemError && orderItem) {
              const { data: order, error: orderError } = await supabase
                .from('orders')
                .select('order_number, client_id, client_name')
                .eq('id', orderItem.order_id)
                .single();

              if (!orderError && order) {
                enrichedProductions.push({
                  ...prod,
                  order_id: orderItem.order_id,
                  order_number: order.order_number,
                  order_item_id: prod.order_item_id,
                  client_id: order.client_id,
                  client_name: order.client_name,
                  production_type: 'order'
                } as OrderProductionItem);
              }
            }
          } catch (err) {
            console.warn('Erro ao buscar dados do pedido:', err);
            // Adicionar mesmo assim, mas como produção interna
            enrichedProductions.push({
              ...prod,
              production_type: 'internal'
            } as InternalProductionItem);
          }
        } else {
          // Produção interna
          enrichedProductions.push({
            ...prod,
            production_type: 'internal'
          } as InternalProductionItem);
        }
      }

      console.log('[useProductionUnified] Produções carregadas:', enrichedProductions.length);
      setProductions(enrichedProductions);

    } catch (err: any) {
      console.error('[useProductionUnified] Erro ao carregar produções:', err);
      setError(err.message);
      showErrorOnce('Erro ao carregar produções: ' + err.message);
    } finally {
      inFlightRef.current = false;
      setLoading(false);
    }
  }, [user, options.filters, options.sorting]);

  // Criar nova produção
  const createProduction = useCallback(async (productionData: ProductionFormData): Promise<boolean> => {
    try {
      setSubmitting(true);

      if (!user) {
        throw new Error('Usuário não autenticado');
      }

      console.log('[useProductionUnified] Criando produção:', productionData);

      const { error } = await supabase
        .from('production')
        .insert({
          product_id: productionData.product_id,
          product_name: productionData.product_name,
          quantity_requested: productionData.quantity_requested,
          notes: productionData.notes,
          order_item_id: productionData.order_item_id,
          status: 'pending',
          user_id: user.id
        });

      if (error) throw error;

      toast.success('Produção criada com sucesso!');
      await loadProductions();
      return true;

    } catch (err: any) {
      console.error('[useProductionUnified] Erro ao criar produção:', err);
      toast.error('Erro ao criar produção: ' + err.message);
      return false;
    } finally {
      setSubmitting(false);
    }
  }, [user, loadProductions]);

  // Atualizar status da produção
  const updateProductionStatus = useCallback(async (
    productionId: string, 
    status: ProductionStatus, 
    quantityProduced?: number
  ): Promise<boolean> => {
    try {
      setSubmitting(true);

      const updateData: any = { status };

      // Adicionar campos específicos baseados no status
      if (status === 'in_progress') {
        updateData.start_date = new Date().toISOString().split('T')[0];
      } else if (status === 'completed') {
        updateData.completion_date = new Date().toISOString().split('T')[0];
        if (quantityProduced !== undefined) {
          updateData.quantity_produced = quantityProduced;
        }
      } else if (status === 'approved') {
        updateData.approved_at = new Date().toISOString();
        if (user) {
          updateData.approved_by = user.email;
        }
        if (quantityProduced !== undefined) {
          updateData.quantity_produced = quantityProduced;
        }
      }

      const { error } = await supabase
        .from('production')
        .update(updateData)
        .eq('id', productionId);

      if (error) throw error;

      // Se aprovado, processar aprovação
      if (status === 'approved') {
        await handleApprovedProduction(productionId, quantityProduced || 0);
      }

      toast.success('Status da produção atualizado com sucesso!');
      await loadProductions();
      return true;

    } catch (err: any) {
      console.error('[useProductionUnified] Erro ao atualizar status:', err);
      toast.error('Erro ao atualizar status: ' + err.message);
      return false;
    } finally {
      setSubmitting(false);
    }
  }, [user, loadProductions]);

  // Processar produção aprovada
  const handleApprovedProduction = async (productionId: string, quantityProduced: number) => {
    try {
      // Buscar dados da produção
      const { data: production, error: prodError } = await supabase
        .from('production')
        .select('*')
        .eq('id', productionId)
        .single();

      if (prodError) throw prodError;

      if (production.order_item_id) {
        // Produção de pedido - criar/atualizar embalagem
        const { data: existingPackaging, error: packError } = await supabase
          .from('packaging')
          .select('*')
          .eq('production_id', productionId)
          .maybeSingle();

        if (packError && packError.code !== 'PGRST116') throw packError;

        if (existingPackaging) {
          // Atualizar embalagem existente - somar quantidade
          const { error: updateError } = await supabase
            .from('packaging')
            .update({
              quantity_to_package: existingPackaging.quantity_to_package + quantityProduced,
              updated_at: new Date().toISOString()
            })
            .eq('id', existingPackaging.id);

          if (updateError) throw updateError;
          console.log(`[PRODUCTION] Somado ${quantityProduced} à embalagem existente`);
        } else {
          // Buscar dados do pedido para criar embalagem
          const { data: orderItem, error: itemError } = await supabase
            .from('order_items')
            .select('order_id')
            .eq('id', production.order_item_id)
            .single();

          if (itemError) throw itemError;

          const { data: order, error: orderError } = await supabase
            .from('orders')
            .select('client_id, client_name')
            .eq('id', orderItem.order_id)
            .single();

          if (orderError) throw orderError;

          // Criar nova embalagem
          const { error: insertError } = await supabase
            .from('packaging')
            .insert({
              user_id: production.user_id,
              production_id: productionId,
              product_id: production.product_id,
              product_name: production.product_name,
              quantity_to_package: quantityProduced,
              status: 'pending',
              order_id: orderItem.order_id,
              client_id: order.client_id,
              client_name: order.client_name,
              tracking_id: production.tracking_id
            });

          if (insertError) throw insertError;
          console.log(`[PRODUCTION] Criada nova embalagem para ${quantityProduced} unidades`);
        }

        // Atualizar tracking do item do pedido
        const { error: trackingError } = await supabase
          .from('order_item_tracking')
          .update({
            quantity_produced_approved: quantityProduced,
            status: 'ready_for_packaging',
            updated_at: new Date().toISOString()
          })
          .eq('order_item_id', production.order_item_id);

        if (trackingError) throw trackingError;

      } else {
        // Produção interna - adicionar ao estoque
        const { data: product, error: productError } = await supabase
          .from('products')
          .select('stock')
          .eq('id', production.product_id)
          .single();

        if (productError) throw productError;

        const { error: stockError } = await supabase
          .from('products')
          .update({
            stock: (product.stock || 0) + quantityProduced,
            updated_at: new Date().toISOString()
          })
          .eq('id', production.product_id);

        if (stockError) throw stockError;
        console.log(`[PRODUCTION] Adicionado ${quantityProduced} ao estoque`);
      }

    } catch (err: any) {
      console.error('[useProductionUnified] Erro ao processar produção aprovada:', err);
      throw err;
    }
  };

  // Buscar produção por ID
  const getProductionById = useCallback((productionId: string): ProductionItem | undefined => {
    return productions.find(prod => prod.id === productionId);
  }, [productions]);

  // Filtrar produções
  const getProductionsByStatus = useCallback((status: ProductionStatus): ProductionItem[] => {
    return productions.filter(prod => prod.status === status);
  }, [productions]);

  const getOrderProductions = useCallback((): OrderProductionItem[] => {
    return productions.filter(prod => prod.production_type === 'order') as OrderProductionItem[];
  }, [productions]);

  const getInternalProductions = useCallback((): InternalProductionItem[] => {
    return productions.filter(prod => prod.production_type === 'internal') as InternalProductionItem[];
  }, [productions]);

  // Estatísticas
  const getProductionStats = useCallback(() => {
    const totalProductions = productions.length;
    const pendingProductions = productions.filter(prod => prod.status === 'pending').length;
    const inProgressProductions = productions.filter(prod => prod.status === 'in_progress').length;
    const completedProductions = productions.filter(prod => prod.status === 'approved').length;
    const totalQuantityRequested = productions.reduce((sum, prod) => sum + prod.quantity_requested, 0);
    const totalQuantityProduced = productions.reduce((sum, prod) => sum + prod.quantity_produced, 0);

    return {
      totalProductions,
      pendingProductions,
      inProgressProductions,
      completedProductions,
      totalQuantityRequested,
      totalQuantityProduced,
      efficiency: totalQuantityRequested > 0 ? (totalQuantityProduced / totalQuantityRequested) * 100 : 0
    };
  }, [productions]);

  // Auto-refresh
  useEffect(() => {
    loadProductions();
    
    if (options.autoRefresh) {
      const interval = setInterval(loadProductions, 30000); // 30 segundos
      return () => clearInterval(interval);
    }
  }, [loadProductions, options.autoRefresh]);

  return {
    // Estado
    productions,
    loading,
    submitting,
    error,
    
    // Ações principais
    loadProductions,
    createProduction,
    updateProductionStatus,
    
    // Utilitários
    getProductionById,
    getProductionsByStatus,
    getOrderProductions,
    getInternalProductions,
    getProductionStats,
    
    // Aliases para compatibilidade
    refreshProductions: loadProductions,
    fetchProductions: loadProductions
  };
};

// Export default para facilitar migration
export default useProductionUnified;