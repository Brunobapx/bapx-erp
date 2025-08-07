import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAuth } from '@/components/Auth/AuthProvider';
import type { 
  PackagingItem, 
  PackagingStatus, 
  PackagingOrigin,
  PackagingFormData, 
  PackagingFilters, 
  PackagingSortOptions 
} from '@/types/packaging';

export interface UsePackagingOptions {
  autoRefresh?: boolean;
  filters?: PackagingFilters;
  sorting?: PackagingSortOptions;
}

export const usePackagingUnified = (options: UsePackagingOptions = {}) => {
  const [packagings, setPackagings] = useState<PackagingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const { user } = useAuth();

  // Função principal para carregar embalagens
  const loadPackagings = useCallback(async (customFilters?: PackagingFilters) => {
    try {
      setLoading(true);
      setError(null);

      if (!user) {
        throw new Error('Usuário não autenticado');
      }

      console.log('[usePackagingUnified] Carregando embalagens para usuário:', user.id);

      // Construir query base
      let query = supabase
        .from('packaging')
        .select('*');

      // Aplicar filtros
      const activeFilters = customFilters || options.filters;
      if (activeFilters?.status) {
        query = query.eq('status', activeFilters.status);
      }

      if (activeFilters?.product) {
        query = query.ilike('product_name', `%${activeFilters.product}%`);
      }

      if (activeFilters?.order) {
        query = query.ilike('order_number', `%${activeFilters.order}%`);
      }

      if (activeFilters?.dateRange) {
        query = query
          .gte('created_at', activeFilters.dateRange.start.toISOString())
          .lte('created_at', activeFilters.dateRange.end.toISOString());
      }

      // Aplicar ordenação
      const sorting = options.sorting || { field: 'created_at', direction: 'desc' };
      query = query.order(sorting.field, { ascending: sorting.direction === 'asc' });

      const { data: rawPackagings, error: fetchError } = await query;

      if (fetchError) throw fetchError;

      // Enriquecer dados das embalagens
      const enrichedPackagings: PackagingItem[] = [];

      for (const pack of rawPackagings || []) {
        let orderData = null;
        let trackingData = null;

        // Se tem production_id, buscar dados do pedido relacionado
        if (pack.production_id) {
          try {
            const { data: production, error: prodError } = await supabase
              .from('production')
              .select('order_item_id')
              .eq('id', pack.production_id)
              .maybeSingle();

            if (!prodError && production && production.order_item_id) {
              // Buscar dados do item do pedido e ordem
              const { data: orderItem, error: itemError } = await supabase
                .from('order_items')
                .select(`
                  order_id,
                  orders (
                    order_number,
                    client_id,
                    client_name
                  )
                `)
                .eq('id', production.order_item_id)
                .maybeSingle();

              if (!itemError && orderItem && orderItem.orders) {
                orderData = {
                  id: orderItem.order_id,
                  ...orderItem.orders
                };
              }
              
              // Buscar dados de tracking por order_item_id
              const { data: tracking, error: trackError } = await supabase
                .from('order_item_tracking')
                .select('*')
                .eq('order_item_id', production.order_item_id)
                .maybeSingle();

              if (!trackError && tracking) {
                trackingData = tracking;
              }
            }
          } catch (err) {
            console.warn('Erro ao buscar dados relacionados:', err);
          }
        } else if (pack.order_id) {
          // Embalagem criada diretamente do estoque: buscar dados do pedido e tracking
          try {
            const { data: orderRow, error: orderErr } = await supabase
              .from('orders')
              .select('order_number, client_id, client_name')
              .eq('id', pack.order_id)
              .maybeSingle();

            if (!orderErr && orderRow) {
              orderData = {
                id: pack.order_id,
                ...orderRow
              };
            }

            // Se tiver tracking_id, buscar para identificar origem e quantidades
            if (pack.tracking_id) {
              const { data: tracking, error: trackError } = await supabase
                .from('order_item_tracking')
                .select('*')
                .eq('id', pack.tracking_id)
                .maybeSingle();

              if (!trackError && tracking) {
                trackingData = tracking;
              }
            }
          } catch (err) {
            console.warn('Erro ao buscar dados do pedido/track da embalagem:', err);
          }
        }

        // Determinar origem e quantidades
        let quantityFromStock = 0;
        let quantityFromProduction = pack.quantity_to_package;
        let origin: PackagingOrigin = 'production';

        if (trackingData) {
          quantityFromStock = trackingData.quantity_from_stock || 0;
          quantityFromProduction = trackingData.quantity_from_production || 0;
          
          if (quantityFromStock > 0 && quantityFromProduction > 0) {
            origin = 'mixed';
          } else if (quantityFromStock > 0) {
            origin = 'stock';
          }
        }

        // Aplicar filtro de origem se especificado
        if (activeFilters?.origin && activeFilters.origin !== 'all' && activeFilters.origin !== origin) {
          continue;
        }

        enrichedPackagings.push({
          id: pack.id,
          packaging_number: pack.packaging_number,
          order_id: orderData?.id || pack.order_id,
          order_number: orderData?.order_number || pack.order_number,
          client_id: orderData?.client_id || pack.client_id,
          client_name: orderData?.client_name || pack.client_name,
          product_id: pack.product_id,
          product_name: pack.product_name,
          quantity_to_package: pack.quantity_to_package,
          quantity_packaged: pack.quantity_packaged || 0,
          quantity_from_stock: quantityFromStock,
          quantity_from_production: quantityFromProduction,
          status: pack.status,
          origin,
          packaged_at: pack.packaged_at,
          approved_at: pack.approved_at,
          packaged_by: pack.packaged_by,
          approved_by: pack.approved_by,
          quality_check: pack.quality_check || false,
          notes: pack.notes,
          created_at: pack.created_at,
          updated_at: pack.updated_at,
          user_id: pack.user_id,
          production_id: pack.production_id,
          tracking_id: pack.tracking_id
        });
      }

      console.log('[usePackagingUnified] Embalagens carregadas:', enrichedPackagings.length);
      setPackagings(enrichedPackagings);

    } catch (err: any) {
      console.error('[usePackagingUnified] Erro ao carregar embalagens:', err);
      setError(err.message);
      toast.error('Erro ao carregar embalagens: ' + err.message);
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Criar nova embalagem
  const createPackaging = useCallback(async (packagingData: PackagingFormData): Promise<boolean> => {
    try {
      setSubmitting(true);

      if (!user) {
        throw new Error('Usuário não autenticado');
      }

      console.log('[usePackagingUnified] Criando embalagem:', packagingData);

      const { error } = await supabase
        .from('packaging')
        .insert({
          product_id: packagingData.product_id,
          product_name: packagingData.product_name,
          quantity_to_package: packagingData.quantity_to_package,
          notes: packagingData.notes,
          order_id: packagingData.order_id,
          client_id: packagingData.client_id,
          client_name: packagingData.client_name,
          production_id: packagingData.production_id,
          status: 'pending',
          user_id: user.id
        });

      if (error) throw error;

      toast.success('Embalagem criada com sucesso!');
      await loadPackagings();
      return true;

    } catch (err: any) {
      console.error('[usePackagingUnified] Erro ao criar embalagem:', err);
      toast.error('Erro ao criar embalagem: ' + err.message);
      return false;
    } finally {
      setSubmitting(false);
    }
  }, [user, loadPackagings]);

  // Atualizar status da embalagem
  const updatePackagingStatus = useCallback(async (
    packagingId: string,
    status: PackagingStatus,
    quantityPackaged?: number,
    qualityCheck?: boolean
  ): Promise<boolean> => {
    try {
      setSubmitting(true);

      const updateData: any = { status };

      if (status === 'in_progress') {
        updateData.packaged_at = new Date().toISOString();
        if (user) {
          updateData.packaged_by = user.email;
        }
      }

      if (status === 'approved') {
        updateData.approved_at = new Date().toISOString();
        if (user) {
          updateData.approved_by = user.email;
        }
      }

      if (quantityPackaged !== undefined) {
        updateData.quantity_packaged = quantityPackaged;
      }

      if (qualityCheck !== undefined) {
        updateData.quality_check = qualityCheck;
      }

      const { error } = await supabase
        .from('packaging')
        .update(updateData)
        .eq('id', packagingId);

      if (error) throw error;

      // Se aprovado, liberar para venda
      if (status === 'approved') {
        await handleApprovedPackaging(packagingId);
      }

      toast.success('Status da embalagem atualizado com sucesso!');
      await loadPackagings();
      return true;

    } catch (err: any) {
      console.error('[usePackagingUnified] Erro ao atualizar status:', err);
      toast.error('Erro ao atualizar status: ' + err.message);
      return false;
    } finally {
      setSubmitting(false);
    }
  }, [user, loadPackagings]);

  // Processar embalagem aprovada
  const handleApprovedPackaging = async (packagingId: string) => {
    try {
      // Buscar dados da embalagem
      const { data: packaging, error: packError } = await supabase
        .from('packaging')
        .select('*')
        .eq('id', packagingId)
        .single();

      if (packError) throw packError;

      // Buscar dados do tracking pelo tracking_id da embalagem
      const { data: tracking, error: trackError } = await supabase
        .from('order_item_tracking')
        .select('*')
        .eq('id', packaging.tracking_id)
        .maybeSingle();

      if (tracking) {
        // Atualizar tracking - somar quantidade embalada aprovada
        const currentApproved = tracking.quantity_packaged_approved || 0;
        const newApproved = currentApproved + packaging.quantity_packaged;
        
        const { error: trackingError } = await supabase
          .from('order_item_tracking')
          .update({
            quantity_packaged_approved: newApproved,
            status: newApproved >= tracking.quantity_target ? 'ready_for_sale' : 'partial_packaging',
            updated_at: new Date().toISOString()
          })
          .eq('id', tracking.id);

        if (trackingError) throw trackingError;

        // Verificar se todos os itens do pedido estão prontos para liberar
        if (packaging.order_id) {
          const { data: allTrackings, error: allError } = await supabase
            .from('order_item_tracking')
            .select(`
              quantity_target,
              quantity_packaged_approved,
              order_items!inner(id, order_id, unit_price, quantity)
            `)
            .eq('order_items.order_id', packaging.order_id);

          if (!allError && allTrackings) {
            const allReady = allTrackings.every(t => 
              (t.quantity_packaged_approved || 0) >= t.quantity_target
            );
            
            if (allReady) {
              // Recalcular totais com base na quantidade APROVADA na embalagem
              let newTotal = 0;
              for (const t of allTrackings as any[]) {
                const unitPrice = t.order_items?.unit_price || 0;
                const qtyApproved = Math.max(0, t.quantity_packaged_approved || 0);
                newTotal += unitPrice * qtyApproved;
              }

              // Atualizar itens do pedido para refletir a quantidade aprovada
              try {
                const updates = (allTrackings as any[]).map(async (t) => {
                  const itemId = t.order_items?.id;
                  if (!itemId) return;
                  const unitPrice = t.order_items?.unit_price || 0;
                  const qtyApproved = Math.max(0, t.quantity_packaged_approved || 0);
                  await supabase
                    .from('order_items')
                    .update({
                      quantity: qtyApproved,
                      total_price: unitPrice * qtyApproved,
                      updated_at: new Date().toISOString()
                    })
                    .eq('id', itemId);
                });
                await Promise.all(updates);
              } catch (updateItemsErr) {
                console.warn('[PACKAGING] Falha ao atualizar itens do pedido após aprovação de embalagem:', updateItemsErr);
              }

              // Liberar pedido para venda e salvar total recalculado
              const { error: orderError } = await supabase
                .from('orders')
                .update({
                  status: 'released_for_sale',
                  total_amount: newTotal,
                  updated_at: new Date().toISOString()
                })
                .eq('id', packaging.order_id);

              if (orderError) throw orderError;
              console.log(`[PACKAGING] Pedido ${packaging.order_id} liberado para venda com total recalculado:`, newTotal);
            }
          }
        }
      }

    } catch (err: any) {
      console.error('[usePackagingUnified] Erro ao processar embalagem aprovada:', err);
      throw err;
    }
  };

  // Buscar embalagem por ID
  const getPackagingById = useCallback((packagingId: string): PackagingItem | undefined => {
    return packagings.find(pack => pack.id === packagingId);
  }, [packagings]);

  // Filtrar embalagens
  const getPackagingsByStatus = useCallback((status: PackagingStatus): PackagingItem[] => {
    return packagings.filter(pack => pack.status === status);
  }, [packagings]);

  const getPackagingsByOrigin = useCallback((origin: PackagingOrigin): PackagingItem[] => {
    return packagings.filter(pack => pack.origin === origin);
  }, [packagings]);

  // Funções de filtro para as diferentes abas
  const getFromStock = useCallback(() => packagings.filter(p => p.origin === 'stock'), [packagings]);
  const getFromProduction = useCallback(() => packagings.filter(p => p.origin === 'production' || p.origin === 'mixed'), [packagings]);
  const getInPackaging = useCallback(() => packagings.filter(p => p.status === 'in_progress'), [packagings]);
  const getReady = useCallback(() => packagings.filter(p => p.status === 'approved' || p.status === 'completed'), [packagings]);

  // Estatísticas
  const getPackagingStats = useCallback(() => {
    const totalPackagings = packagings.length;
    const pendingPackagings = packagings.filter(pack => pack.status === 'pending').length;
    const inProgressPackagings = packagings.filter(pack => pack.status === 'in_progress').length;
    const completedPackagings = packagings.filter(pack => pack.status === 'approved').length;
    const totalQuantityToPackage = packagings.reduce((sum, pack) => sum + pack.quantity_to_package, 0);
    const totalQuantityPackaged = packagings.reduce((sum, pack) => sum + pack.quantity_packaged, 0);

    return {
      totalPackagings,
      pendingPackagings,
      inProgressPackagings,
      completedPackagings,
      totalQuantityToPackage,
      totalQuantityPackaged,
      efficiency: totalQuantityToPackage > 0 ? (totalQuantityPackaged / totalQuantityToPackage) * 100 : 0
    };
  }, [packagings]);

  // Auto-refresh
  useEffect(() => {
    loadPackagings();
    
    if (options.autoRefresh) {
      const interval = setInterval(loadPackagings, 30000); // 30 segundos
      return () => clearInterval(interval);
    }
  }, [loadPackagings, options.autoRefresh]);

  return {
    // Estado
    packagings,
    loading,
    submitting,
    error,
    
    // Ações principais
    loadPackagings,
    createPackaging,
    updatePackagingStatus,
    
    // Utilitários
    getPackagingById,
    getPackagingsByStatus,
    getPackagingsByOrigin,
    getPackagingStats,
    
    // Filtros para as abas (compatibilidade)
    fromStock: getFromStock(),
    fromProduction: getFromProduction(),
    inPackaging: getInPackaging(),
    ready: getReady(),
    
    // Aliases para compatibilidade
    refreshPackagings: loadPackagings,
    fetchPackagings: loadPackagings
  };
};

// Export default para facilitar migration
export default usePackagingUnified;