// REFATORADO: Agora usa usePackagingUnified para reduzir duplicação
import { usePackagingUnified } from './usePackagingUnified';
import type { 
  PackagingFlowStatus, 
  PackagingFlowItem 
} from '@/types/packaging';

export type { PackagingFlowStatus, PackagingFlowItem };

export const usePackagingFlow = () => {
  // Usar o hook unificado
  const packagingHook = usePackagingUnified({
    autoRefresh: false, // PackagingFlow tinha refresh manual
    sorting: { field: 'created_at', direction: 'desc' }
  });

  return {
    // Interface legacy mantida
    packagings: packagingHook.packagings,
    loading: packagingHook.loading,
    error: packagingHook.error,
    fetchPackagings: packagingHook.loadPackagings,
    updatePackagingStatus: packagingHook.updatePackagingStatus,
    refreshPackagings: packagingHook.refreshPackagings,
    
    // Filtros para as abas (compatibilidade)
    fromStock: packagingHook.fromStock,
    fromProduction: packagingHook.fromProduction,
    inPackaging: packagingHook.inPackaging,
    ready: packagingHook.ready,
    
    // Novos métodos também disponíveis
    ...packagingHook
  };
};

      if (packagingError) throw packagingError;

      const enrichedPackagings: PackagingFlowItem[] = [];

      for (const pack of packagingData || []) {
        let orderData = null;
        let trackingData = null;

        // Se tem production_id, buscar dados do pedido relacionado
        if (pack.production_id) {
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
                orders!inner (
                  order_number,
                  client_id,
                  client_name
                )
              `)
              .eq('id', production.order_item_id)
              .maybeSingle();

            if (!itemError && orderItem) {
              orderData = orderItem.orders;
            }
            
            // Buscar dados de tracking
            const { data: tracking, error: trackError } = await supabase
              .from('order_item_tracking')
              .select('*')
              .eq('order_item_id', production.order_item_id)
              .maybeSingle();

            if (!trackError && tracking) {
              trackingData = tracking;
            }
          }
        }

        // Determinar origem e quantidades
        let quantityFromStock = 0;
        let quantityFromProduction = pack.quantity_to_package;
        let origin: 'stock' | 'production' | 'mixed' = 'production';

        if (trackingData) {
          quantityFromStock = trackingData.quantity_from_stock || 0;
          quantityFromProduction = trackingData.quantity_from_production || 0;
          
          if (quantityFromStock > 0 && quantityFromProduction > 0) {
            origin = 'mixed';
          } else if (quantityFromStock > 0) {
            origin = 'stock';
          }
        }

        enrichedPackagings.push({
          id: pack.id,
          packaging_number: pack.packaging_number,
          order_id: orderData?.id,
          order_number: orderData?.order_number,
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

      setPackagings(enrichedPackagings);

    } catch (err: any) {
      setError(err.message);
      console.error('Erro ao buscar embalagens:', err);
    } finally {
      setLoading(false);
    }
  };

  const updatePackagingStatus = async (
    packagingId: string,
    status: PackagingFlowStatus,
    quantityPackaged?: number,
    qualityCheck?: boolean
  ): Promise<boolean> => {
    try {
      const updateData: any = { status };

      if (status === 'in_progress') {
        updateData.packaged_at = new Date().toISOString();
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          updateData.packaged_by = user.email;
        }
      }

      if (status === 'approved') {
        updateData.approved_at = new Date().toISOString();
        const { data: { user } } = await supabase.auth.getUser();
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
      await fetchPackagings();
      return true;

    } catch (err: any) {
      console.error('Erro ao atualizar status da embalagem:', err);
      toast.error('Erro ao atualizar status da embalagem: ' + err.message);
      return false;
    }
  };

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
                order_items!inner(order_id)
              `)
              .eq('order_items.order_id', packaging.order_id);

            if (!allError && allTrackings) {
              const allReady = allTrackings.every(t => 
                (t.quantity_packaged_approved || 0) >= t.quantity_target
              );
              
              if (allReady) {
                // Liberar pedido para venda
                const { error: orderError } = await supabase
                  .from('orders')
                  .update({
                    status: 'released_for_sale',
                    updated_at: new Date().toISOString()
                  })
                  .eq('id', packaging.order_id);

                if (orderError) throw orderError;
                console.log(`[PACKAGING] Pedido ${packaging.order_id} liberado para venda - todos itens aprovados`);
              }
            }
          }
        }

    } catch (err: any) {
      console.error('Erro ao processar embalagem aprovada:', err);
      throw err;
    }
  };

  // Funções de filtro para as diferentes abas
  const getFromStock = () => packagings.filter(p => p.origin === 'stock');
  const getFromProduction = () => packagings.filter(p => p.origin === 'production' || p.origin === 'mixed');
  const getInPackaging = () => packagings.filter(p => p.status === 'in_progress');
  const getReady = () => packagings.filter(p => p.status === 'approved' || p.status === 'completed');

  useEffect(() => {
    fetchPackagings();
  }, []);

  return {
    packagings,
    loading,
    error,
    fetchPackagings,
    updatePackagingStatus,
    refreshPackagings: fetchPackagings,
    // Filtros para as abas
    fromStock: getFromStock(),
    fromProduction: getFromProduction(),
    inPackaging: getInPackaging(),
    ready: getReady()
  };
};