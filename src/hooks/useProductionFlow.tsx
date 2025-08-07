// REFATORADO: Agora usa useProductionUnified para reduzir duplicação
import { useProductionUnified } from './useProductionUnified';
import type { 
  ProductionFlowStatus, 
  ProductionFlowItem, 
  InternalProductionItem,
  OrderProductionItem
} from '@/types/production';

export type { ProductionFlowStatus, ProductionFlowItem, InternalProductionItem };

export const useProductionFlow = () => {
  // Usar o hook unificado
  const productionHook = useProductionUnified({
    autoRefresh: false, // ProductionFlow tinha refresh manual
    sorting: { field: 'created_at', direction: 'desc' }
  });

  // Mapear para interface legacy
  const productions = productionHook.getOrderProductions();
  const internalProductions = productionHook.getInternalProductions();

  return {
    // Interface legacy mantida
    productions,
    internalProductions,
    loading: productionHook.loading,
    error: productionHook.error,
    fetchProductions: productionHook.loadProductions,
    updateProductionStatus: productionHook.updateProductionStatus,
    refreshProductions: productionHook.refreshProductions,
    
    // Novos métodos também disponíveis
    ...productionHook
  };
};

  const fetchProductions = async () => {
    try {
      setLoading(true);
      setError(null);

      // Buscar produções ligadas a pedidos
      const { data: orderProductions, error: orderError } = await supabase
        .from('production')
        .select('*')
        .not('order_item_id', 'is', null)
        .order('created_at', { ascending: false });

      if (orderError) throw orderError;

      // Buscar dados dos pedidos para cada produção
      const mappedOrderProductions: ProductionFlowItem[] = [];
      
      for (const prod of orderProductions || []) {
        // Buscar dados do order_item
        const { data: orderItem, error: itemError } = await supabase
          .from('order_items')
          .select('order_id')
          .eq('id', prod.order_item_id)
          .maybeSingle();

        if (!itemError && orderItem) {
          // Buscar dados do pedido
          const { data: order, error: orderError } = await supabase
            .from('orders')
            .select('order_number, client_id, client_name')
            .eq('id', orderItem.order_id)
            .maybeSingle();

          
          if (!orderError && order) {
            mappedOrderProductions.push({
              id: prod.id,
              production_number: prod.production_number,
              order_id: orderItem.order_id,
              order_number: order.order_number,
              order_item_id: prod.order_item_id,
              product_id: prod.product_id,
              product_name: prod.product_name,
              client_id: order.client_id,
              client_name: order.client_name,
            quantity_requested: prod.quantity_requested,
            quantity_produced: prod.quantity_produced || 0,
            status: prod.status,
            start_date: prod.start_date,
            completion_date: prod.completion_date,
            approved_at: prod.approved_at,
            approved_by: prod.approved_by,
            notes: prod.notes,
            created_at: prod.created_at,
            updated_at: prod.updated_at,
            user_id: prod.user_id,
            tracking_id: prod.tracking_id
            });
          }
        }
      }

      // Buscar produções internas (sem pedido)
      const { data: internalProd, error: internalError } = await supabase
        .from('production')
        .select('*')
        .is('order_item_id', null)
        .order('created_at', { ascending: false });

      if (internalError) throw internalError;

      const mappedInternalProductions: InternalProductionItem[] = (internalProd || []).map(prod => ({
        id: prod.id,
        production_number: prod.production_number,
        product_id: prod.product_id,
        product_name: prod.product_name,
        quantity_requested: prod.quantity_requested,
        quantity_produced: prod.quantity_produced || 0,
        status: prod.status,
        notes: prod.notes,
        created_at: prod.created_at,
        updated_at: prod.updated_at,
        user_id: prod.user_id
      }));

      setProductions(mappedOrderProductions);
      setInternalProductions(mappedInternalProductions);

    } catch (err: any) {
      setError(err.message);
      console.error('Erro ao buscar produções:', err);
    } finally {
      setLoading(false);
    }
  };

  const updateProductionStatus = async (
    productionId: string, 
    status: ProductionFlowStatus, 
    quantityProduced?: number
  ): Promise<boolean> => {
    try {
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
        const { data: { user } } = await supabase.auth.getUser();
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

      // Se aprovado, criar/atualizar embalagem
      if (status === 'approved') {
        await handleApprovedProduction(productionId, quantityProduced || 0);
      }

      toast.success('Status da produção atualizado com sucesso!');
      await fetchProductions();
      return true;

    } catch (err: any) {
      console.error('Erro ao atualizar status da produção:', err);
      toast.error('Erro ao atualizar status da produção: ' + err.message);
      return false;
    }
  };

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
          // Atualizar embalagem existente - somar quantidade da produção
          const { error: updateError } = await supabase
            .from('packaging')
            .update({
              quantity_to_package: existingPackaging.quantity_to_package + quantityProduced,
              updated_at: new Date().toISOString()
            })
            .eq('id', existingPackaging.id);

          if (updateError) throw updateError;
          console.log(`[PRODUCTION] Somado ${quantityProduced} à embalagem existente (total: ${existingPackaging.quantity_to_package + quantityProduced})`);
        } else {
          // Buscar dados do pedido para criar embalagem completa
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

          // Criar nova embalagem com dados completos
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
      }

    } catch (err: any) {
      console.error('Erro ao processar produção aprovada:', err);
      throw err;
    }
  };

  useEffect(() => {
    fetchProductions();
  }, []);

  return {
    productions,
    internalProductions,
    loading,
    error,
    fetchProductions,
    updateProductionStatus,
    refreshProductions: fetchProductions
  };
};