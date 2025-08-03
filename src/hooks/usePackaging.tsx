import { useState, useEffect } from 'react';
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

export type PackagingStatus = 
  | 'pending'
  | 'in_progress'
  | 'completed'
  | 'approved'
  | 'rejected';

export type Packaging = {
  id: string;
  packaging_number: string;
  production_id: string | null;
  product_id: string;
  product_name: string;
  quantity_to_package: number;
  quantity_packaged: number;
  status: PackagingStatus;
  packaged_by?: string;
  packaged_at?: string;
  approved_by?: string;
  approved_at?: string;
  quality_check: boolean;
  notes?: string;
  created_at?: string;
  updated_at?: string;
  user_id?: string;
  order_id?: string;
  client_id?: string;
  client_name?: string;
  order_number?: string;
};

export const usePackaging = () => {
  const [packagings, setPackagings] = useState<Packaging[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  useEffect(() => {
    const fetchPackagings = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        
        if (userError || !user) {
          throw new Error('Usuário não autenticado');
        }

        const { data, error } = await supabase
          .from('packaging')
          .select(`
            *
          `)
          .order('created_at', { ascending: false });
        
        if (error) throw error;
        
        // Mapear os dados para incluir order_number e client_name
        const packagingsWithOrderInfo = await Promise.all((data || []).map(async (pack) => {
          // Se tem order_id e client_name diretamente (embalagem direta do estoque)
          if (pack.order_id && pack.client_name) {
            return {
              ...pack,
              order_number: `Pedido-${pack.order_id.slice(-6)}`,
              client_name: pack.client_name
            };
          }
          
          // Se tem production_id, buscar dados da produção e pedido
          if (pack.production_id) {
            const { data: productionData } = await supabase
              .from('production')
              .select(`
                order_item_id
              `)
              .eq('id', pack.production_id)
              .single();
            
            if (productionData?.order_item_id) {
              const { data: orderItemData } = await supabase
                .from('order_items')
                .select(`
                  order_id,
                  orders(
                    order_number,
                    client_name
                  )
                `)
                .eq('id', productionData.order_item_id)
                .single();
              
              if (orderItemData?.orders) {
                const orderData = Array.isArray(orderItemData.orders) ? orderItemData.orders[0] : orderItemData.orders;
                return {
                  ...pack,
                  order_number: orderData?.order_number || 'N/A',
                  client_name: orderData?.client_name || 'N/A'
                };
              }
            }
          }
          
          // Fallback
          return {
            ...pack,
            order_number: 'N/A',
            client_name: 'N/A'
          };
        }));
        
        setPackagings(packagingsWithOrderInfo);
      } catch (error: any) {
        console.error('Erro ao carregar embalagem:', error);
        setError(error.message || 'Erro ao carregar embalagem');
        toast.error('Erro ao carregar embalagem');
      } finally {
        setLoading(false);
      }
    };

    fetchPackagings();
  }, [refreshTrigger]);

  const refreshPackagings = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  // Função para verificar se todos os itens do pedido foram aprovados na embalagem
  const checkAllOrderItemsPackaged = async (orderId: string) => {
    try {
      // Buscar todos os itens do pedido
      const { data: orderItems, error: orderItemsError } = await supabase
        .from('order_items')
        .select('id')
        .eq('order_id', orderId);

      if (orderItemsError) throw orderItemsError;

      // Para cada item do pedido, verificar se existe produção aprovada e embalagem aprovada
      for (const item of orderItems) {
        // Verificar se existe produção aprovada para este item
        const { data: productions, error: productionError } = await supabase
          .from('production')
          .select('id, status')
          .eq('order_item_id', item.id);

        if (productionError) throw productionError;

        // Se não há produção para este item, verificar se é um item que não precisa de produção
        if (!productions || productions.length === 0) {
          // Buscar o produto para ver se é fabricado
          const { data: orderItemData, error: itemError } = await supabase
            .from('order_items')
            .select(`
              product_id,
              products!inner(is_manufactured)
            `)
            .eq('id', item.id)
            .single();

          if (itemError) throw itemError;

          // Se é fabricado mas não tem produção, não está pronto
          if (orderItemData.products?.[0]?.is_manufactured) {
            console.log(`Item ${item.id} é fabricado mas não tem produção aprovada`);
            return false;
          }
          // Se não é fabricado, não precisa passar por produção/embalagem
          continue;
        }

        // Verificar se todas as produções estão aprovadas
        const hasUnapprovedProduction = productions.some(prod => prod.status !== 'approved');
        if (hasUnapprovedProduction) {
          console.log(`Item ${item.id} tem produção não aprovada`);
          return false;
        }

        // Para cada produção aprovada, verificar se tem embalagem aprovada
        for (const production of productions) {
          const { data: packaging, error: packagingError } = await supabase
            .from('packaging')
            .select('status')
            .eq('production_id', production.id)
            .maybeSingle();

          if (packagingError) throw packagingError;

          // Se não tem embalagem ou não está aprovada
          if (!packaging || packaging.status !== 'approved') {
            console.log(`Produção ${production.id} não tem embalagem aprovada`);
            return false;
          }
        }
      }

      console.log(`Todos os itens do pedido ${orderId} foram aprovados na embalagem`);
      return true;
    } catch (error) {
      console.error('Erro ao verificar itens do pedido:', error);
      return false;
    }
  };

  // Função para verificar se todos os itens do pedido estão aprovados na embalagem
  const checkAllOrderItemsForApproval = async (orderId: string) => {
    try {
      // Buscar todos os itens do pedido
      const { data: orderItems, error: orderItemsError } = await supabase
        .from('order_items')
        .select('id, product_id')
        .eq('order_id', orderId);

      if (orderItemsError) throw orderItemsError;

      for (const item of orderItems) {
        // Verificar se existe produção para este item
        const { data: productions, error: productionError } = await supabase
          .from('production')
          .select('id, status')
          .eq('order_item_id', item.id);

        if (productionError) throw productionError;

        // Se tem produção, verificar se está aprovada e se tem embalagem aprovada
        if (productions && productions.length > 0) {
          for (const production of productions) {
            if (production.status !== 'approved') {
              console.log(`Produção ${production.id} não aprovada`);
              return false;
            }
            
            // Verificar embalagem da produção
            const { data: packaging, error: packagingError } = await supabase
              .from('packaging')
              .select('status')
              .eq('production_id', production.id)
              .single();

            if (packagingError || packaging.status !== 'approved') {
              console.log(`Embalagem da produção ${production.id} não aprovada`);
              return false;
            }
          }
        } else {
          // Item direto do estoque - verificar embalagem direta
          const { data: directPackaging, error: directPackagingError } = await supabase
            .from('packaging')
            .select('status')
            .eq('order_id', orderId)
            .eq('product_id', item.product_id)
            .is('production_id', null)
            .maybeSingle();

          if (directPackagingError) throw directPackagingError;

          if (!directPackaging || directPackaging.status !== 'approved') {
            console.log(`Embalagem direta do item ${item.id} não aprovada`);
            return false;
          }
        }
      }

      console.log(`Todos os itens do pedido ${orderId} estão aprovados na embalagem`);
      return true;
    } catch (error) {
      console.error('Erro ao verificar aprovação dos itens:', error);
      return false;
    }
  };

  const updatePackagingStatus = async (
    id: string, 
    status: PackagingStatus, 
    quantityPackaged?: number,
    qualityCheck?: boolean
  ) => {
    try {
      const updateData: any = { 
        status,
        updated_at: new Date().toISOString()
      };
      
      if (quantityPackaged !== undefined) {
        updateData.quantity_packaged = quantityPackaged;
      }
      
      if (qualityCheck !== undefined) {
        updateData.quality_check = qualityCheck;
      }
      
      if (status === 'completed') {
        updateData.packaged_at = new Date().toISOString();
        const { data: { user } } = await supabase.auth.getUser();
        updateData.packaged_by = user?.email || 'Sistema';
      }
      
      if (status === 'approved') {
        updateData.approved_at = new Date().toISOString();
        const { data: { user } } = await supabase.auth.getUser();
        updateData.approved_by = user?.email || 'Sistema';
        
        // Atualizar embalagem como aprovada
        const { error: updateError } = await supabase
          .from('packaging')
          .update(updateData)
          .eq('id', id);
        if (updateError) throw updateError;

        // Buscar os dados completos da embalagem incluindo tracking_id
        const { data: packagingData, error: packagingError } = await supabase
          .from('packaging')
          .select('*')
          .eq('id', id)
          .single();
        
        if (packagingError) throw packagingError;

        const finalQuantity = quantityPackaged || packagingData.quantity_packaged || packagingData.quantity_to_package;
        
        console.log(`[TRACKING] Aprovando embalagem: ${finalQuantity} unidades de ${packagingData.product_name}`);

        // Se tem tracking_id, usar novo sistema
        if (packagingData.tracking_id) {
          console.log(`[TRACKING] Atualizando tracking ${packagingData.tracking_id} com ${finalQuantity} unidades aprovadas`);
          
          // Atualizar tracking com quantidade final aprovada
          const { error: trackingError } = await supabase
            .from('order_item_tracking')
            .update({
              quantity_packaged_approved: finalQuantity,
              status: 'complete_ready'
            })
            .eq('id', packagingData.tracking_id);
            
          if (trackingError) {
            console.error('Erro ao atualizar tracking:', trackingError);
            toast.error('Erro ao atualizar rastreamento do item');
            return false;
          }

          // Buscar dados do tracking para recalcular valores
          const { data: trackingData, error: trackingFetchError } = await supabase
            .from('order_item_tracking')
            .select(`
              *,
              order_items!inner(
                id,
                order_id,
                unit_price,
                orders!inner(
                  id,
                  client_id,
                  client_name
                )
              )
            `)
            .eq('id', packagingData.tracking_id)
            .single();
            
          if (trackingFetchError) {
            console.error('Erro ao buscar tracking:', trackingFetchError);
            toast.error('Erro ao buscar dados do tracking');
            return false;
          }

          // Recalcular valor do item baseado na quantidade aprovada
          const orderItem = trackingData.order_items;
          const newTotalPrice = finalQuantity * orderItem.unit_price;
          
          // Atualizar item do pedido com quantidade e valor final
          const { error: itemUpdateError } = await supabase
            .from('order_items')
            .update({
              quantity: finalQuantity,
              total_price: newTotalPrice,
              updated_at: new Date().toISOString()
            })
            .eq('id', orderItem.id);
            
          if (itemUpdateError) {
            console.error('Erro ao atualizar item do pedido:', itemUpdateError);
            toast.error('Erro ao atualizar item do pedido');
            return false;
          }

          console.log(`[TRACKING] Item atualizado: ${orderItem.id} - ${finalQuantity} unidades, valor: R$ ${newTotalPrice.toFixed(2)}`);
          
          if (finalQuantity < trackingData.quantity_target) {
            toast.warning(`Quantidade ajustada: ${trackingData.quantity_target} → ${finalQuantity} unidades`);
          }

          // Verificar se todos os itens do pedido estão prontos para venda
          const orderId = orderItem.order_id;
          
          // Buscar todos os trackings do pedido
          const { data: allTrackings, error: allTrackingsError } = await supabase
            .from('order_item_tracking')
            .select('status')
            .in('order_item_id', 
              await supabase
                .from('order_items')
                .select('id')
                .eq('order_id', orderId)
                .then(res => res.data?.map(item => item.id) || [])
            );
            
          if (allTrackingsError) {
            console.error('Erro ao verificar trackings do pedido:', allTrackingsError);
          }

          const allItemsReady = allTrackings?.every(t => t.status === 'complete_ready') || false;
          
          console.log(`[TRACKING] Pedido ${orderId} - Todos os itens prontos: ${allItemsReady ? 'SIM' : 'NÃO'}`);
          
          if (!allItemsReady) {
            toast.info('Embalagem aprovada! Aguardando todos os itens do pedido ficarem prontos.');
            refreshPackagings();
            return true;
          }

          // Recalcular valor total do pedido
          const { data: orderItems, error: itemsError } = await supabase
            .from('order_items')
            .select('total_price')
            .eq('order_id', orderId);
            
          if (itemsError) {
            console.error('Erro ao buscar itens do pedido:', itemsError);
          }

          const totalAmount = orderItems?.reduce((sum, item) => sum + item.total_price, 0) || 0;
          
          // Atualizar total do pedido
          const { error: orderUpdateError } = await supabase
            .from('orders')
            .update({
              total_amount: totalAmount,
              updated_at: new Date().toISOString()
            })
            .eq('id', orderId);
            
          if (orderUpdateError) {
            console.error('Erro ao atualizar pedido:', orderUpdateError);
          }

          console.log(`[TRACKING] Pedido ${orderId} recalculado: R$ ${totalAmount.toFixed(2)}`);

          // Verificar se já existe venda
          const { data: existingSale, error: saleCheckError } = await supabase
            .from('sales')
            .select('id')
            .eq('order_id', orderId)
            .maybeSingle();
            
          if (saleCheckError) {
            console.error('Erro ao verificar venda existente:', saleCheckError);
          }

          if (!existingSale) {
            // Criar venda
            const order = orderItem.orders;
            const { error: saleError } = await supabase
              .from('sales')
              .insert({
                user_id: user?.id,
                order_id: orderId,
                client_id: order.client_id,
                client_name: order.client_name,
                total_amount: totalAmount,
                status: 'pending'
              });
              
            if (saleError) {
              console.error('Erro ao criar venda:', saleError);
              toast.error('Erro ao criar venda');
            } else {
              console.log(`[TRACKING] Venda criada para ${order.client_name}: R$ ${totalAmount.toFixed(2)}`);
              toast.success(`Todos os itens aprovados! Venda liberada para ${order.client_name} - R$ ${totalAmount.toFixed(2)}`);
            }
          } else {
            toast.success('Embalagem aprovada! Venda já existe para este pedido.');
          }
          
        } else {
          // Sistema antigo - embalagem sem tracking
          toast.success(`Embalagem aprovada! ${finalQuantity} unidades de ${packagingData.product_name} processadas.`);
        }
        
        refreshPackagings();
        return true;
      }

      const { error } = await supabase
        .from('packaging')
        .update(updateData)
        .eq('id', id);
      
      if (error) throw error;
      
      toast.success('Status de embalagem atualizado com sucesso');
      refreshPackagings();
      return true;
    } catch (error: any) {
      console.error('Erro ao atualizar embalagem:', error);
      toast.error('Erro ao atualizar embalagem');
      return false;
    }
  };

  return {
    packagings,
    loading,
    error,
    refreshPackagings,
    updatePackagingStatus
  };
};