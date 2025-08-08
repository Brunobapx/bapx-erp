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

      // Regra: após aprovado, não permitir alterações
      const { data: current, error: currentErr } = await supabase
        .from('packaging')
        .select('id,status')
        .eq('id', packagingId)
        .single();
      if (currentErr) throw currentErr;
      if (current?.status === 'approved') {
        toast.error('Embalagem já aprovada não pode ser alterada.');
        return false;
      }

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

      // Resolver registro de tracking associado à embalagem e o order_id
      let tracking: any = null;
      let targetOrderId: string | null = packaging.order_id || null;

      // 1) Tente pelo tracking_id da própria embalagem
      if (packaging.tracking_id) {
        const { data: byId } = await supabase
          .from('order_item_tracking')
          .select('*')
          .eq('id', packaging.tracking_id)
          .maybeSingle();
        if (byId) tracking = byId;
      }

      // 2) Se não encontrou, tente via produção -> order_item_id (e derive o order_id)
      if (!tracking && packaging.production_id) {
        const { data: production } = await supabase
          .from('production')
          .select('order_item_id, tracking_id')
          .eq('id', packaging.production_id)
          .maybeSingle();

        // Resolver tracking via produção
        if (production?.tracking_id) {
          const { data: byProdTrack } = await supabase
            .from('order_item_tracking')
            .select('*')
            .eq('id', production.tracking_id)
            .maybeSingle();
          if (byProdTrack) tracking = byProdTrack;
        }
        if (!tracking && production?.order_item_id) {
          const { data: byOrderItem } = await supabase
            .from('order_item_tracking')
            .select('*')
            .eq('order_item_id', production.order_item_id)
            .maybeSingle();
          if (byOrderItem) tracking = byOrderItem;
        }

        // Derivar order_id a partir do order_item_id
        if (!targetOrderId && production?.order_item_id) {
          const { data: orderItemRow } = await supabase
            .from('order_items')
            .select('order_id')
            .eq('id', production.order_item_id)
            .maybeSingle();
          if (orderItemRow?.order_id) targetOrderId = orderItemRow.order_id;
        }
      }

      // 3) Fallback: tente localizar pelo pedido + produto (usando targetOrderId se existir)
      if (!tracking && (targetOrderId || packaging.order_id)) {
        const orderIdToUse = targetOrderId || packaging.order_id;
        const { data: item } = await supabase
          .from('order_items')
          .select('id')
          .eq('order_id', orderIdToUse!)
          .eq('product_id', packaging.product_id)
          .maybeSingle();
        if (item) {
          const { data: byItem } = await supabase
            .from('order_item_tracking')
            .select('*')
            .eq('order_item_id', item.id)
            .maybeSingle();
          if (byItem) tracking = byItem;
        }
      }

      // Última tentativa de derivar o order_id pelo tracking
      if (!targetOrderId && tracking?.order_item_id) {
        const { data: orderItemRow } = await supabase
          .from('order_items')
          .select('order_id')
          .eq('id', tracking.order_item_id)
          .maybeSingle();
        if (orderItemRow?.order_id) targetOrderId = orderItemRow.order_id;
      }

      if (tracking) {
        // Atualizar tracking - somar quantidade embalada aprovada
        const currentApproved = tracking.quantity_packaged_approved || 0;
        const approvedFromPackaging = Math.max(0, Number(packaging.quantity_packaged) || 0);
        const newApproved = currentApproved + approvedFromPackaging;
        
        const { error: trackingError } = await supabase
          .from('order_item_tracking')
          .update({
            quantity_packaged_approved: newApproved,
            status: newApproved >= tracking.quantity_target ? 'ready_for_sale' : 'partial_packaging',
            updated_at: new Date().toISOString()
          })
          .eq('id', tracking.id);

        if (trackingError) throw trackingError;

        // Se descobrimos o order_id e ele não está salvo na embalagem, persistir para consistência
        if (!packaging.order_id && targetOrderId) {
          await supabase
            .from('packaging')
            .update({ order_id: targetOrderId })
            .eq('id', packaging.id);
        }

        // Verificar se todos os itens do pedido estão prontos para liberar
        if (targetOrderId) {
          const { data: allTrackings, error: allError } = await supabase
            .from('order_item_tracking')
            .select(`
              quantity_target,
              quantity_packaged_approved,
              order_items!inner(id, order_id, unit_price, quantity)
            `)
            .eq('order_items.order_id', targetOrderId);

          if (!allError && allTrackings) {
            const allReady = allTrackings.every(t => 
              (t.quantity_packaged_approved || 0) >= t.quantity_target
            );
            
            // Recalcular total com base na quantidade APROVADA até o momento (mesmo que parcial)
            let newTotal = 0;
            for (const t of allTrackings as any[]) {
              const unitPrice = t.order_items?.unit_price || 0;
              const qtyApproved = Math.max(0, t.quantity_packaged_approved || 0);
              newTotal += unitPrice * qtyApproved;
            }

            // Garantir que a venda exista/atualize com o total parcial
            try {
              const { data: existingSale } = await supabase
                .from('sales')
                .select('id, user_id')
                .eq('order_id', targetOrderId)
                .maybeSingle();

              const { data: orderRow } = await supabase
                .from('orders')
                .select('client_id, client_name, user_id, seller_id')
                .eq('id', targetOrderId)
                .maybeSingle();

              const currentUserId = user?.id || orderRow?.user_id || null;

              if (!existingSale) {
                // Gerar número de venda (sequência por empresa)
                const { data: seq } = await supabase
                  .rpc('generate_sequence_number', { prefix: 'V', table_name: 'sales', user_id: currentUserId });
                const saleNumber = seq ?? `V-${Date.now()}`;

                await supabase
                  .from('sales')
                  .insert({
                    user_id: currentUserId!,
                    salesperson_id: orderRow?.seller_id || null,
                    order_id: targetOrderId,
                    client_id: orderRow?.client_id,
                    client_name: orderRow?.client_name || '',
                    total_amount: newTotal,
                    sale_number: saleNumber,
                    status: 'pending'
                  });
              } else {
                if (existingSale.user_id === currentUserId) {
                  await supabase
                    .from('sales')
                    .update({
                      user_id: currentUserId!,
                      salesperson_id: orderRow?.seller_id || null,
                      client_id: orderRow?.client_id,
                      client_name: orderRow?.client_name || '',
                      total_amount: newTotal,
                      updated_at: new Date().toISOString()
                    })
                    .eq('id', existingSale.id);
                } else {
                  console.warn('[PACKAGING] Venda existente pertence a outro usuário; ignorando atualização para cumprir RLS.');
                }
              }
            } catch (saleCreateErr) {
              console.warn('[PACKAGING] Não foi possível criar/atualizar a venda automaticamente:', saleCreateErr);
            }
            
            if (allReady) {
              // Atualizar itens do pedido para refletir a quantidade aprovada (quando todos prontos)
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
                .eq('id', targetOrderId);

              if (orderError) throw orderError;

              console.log(`[PACKAGING] Pedido ${targetOrderId} liberado para venda com total recalculado:`, newTotal);
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