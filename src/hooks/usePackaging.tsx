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
            *,
            production(
              order_item_id,
              order_items(
                order_id,
                quantity,
                unit_price,
                total_price,
                orders(
                  id,
                  order_number,
                  client_id,
                  client_name,
                  total_amount
                )
              )
            )
          `)
          
          .order('created_at', { ascending: false });
        
        if (error) throw error;
        
        // Mapear os dados para incluir order_number e client_name com prioridade para dados diretos
        const packagingsWithOrderInfo = (data || []).map(pack => {
          // Se tem order_id e client_name diretamente (embalagem direta do estoque)
          if (pack.order_id && pack.client_name) {
            return {
              ...pack,
              order_number: `Pedido Direct-${pack.order_id.slice(-6)}`,
              client_name: pack.client_name
            };
          }
          
          // Se tem production associada (vem da produção)
          if (pack.production?.order_items?.orders) {
            return {
              ...pack,
              order_number: pack.production.order_items.orders.order_number || 'N/A',
              client_name: pack.production.order_items.orders.client_name || 'N/A'
            };
          }
          
          // Fallback
          return {
            ...pack,
            order_number: 'N/A',
            client_name: 'N/A'
          };
        });
        
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

        // Buscar os dados completos da embalagem
        const { data: packagingData, error: packagingError } = await supabase
          .from('packaging')
          .select(`
            *,
            production(
              order_item_id,
              order_items(
                id,
                order_id,
                quantity,
                unit_price,
                total_price,
                orders(
                  id,
                  order_number,
                  client_id,
                  client_name,
                  total_amount
                )
              )
            )
          `)
          .eq('id', id)
          .single();
        
        if (packagingError) throw packagingError;

        let orderId, orderNumber, clientId, clientName, orderTotal;
        let orderItemId, orderItem, prodQuantity, unitPrice;

        // --- FLUXO: Embalagem de produção associada a item de pedido
        if (packagingData.production && packagingData.production.order_items && packagingData.production.order_items.orders) {
          orderItem = packagingData.production.order_items;
          orderItemId = orderItem.id;
          orderId = orderItem.orders.id;
          orderNumber = orderItem.orders.order_number;
          clientId = orderItem.orders.client_id;
          clientName = orderItem.orders.client_name;
          orderTotal = orderItem.orders.total_amount;
          prodQuantity = quantityPackaged || packagingData.quantity_packaged || packagingData.quantity_to_package;
          unitPrice = orderItem.unit_price;

          // Atualizar o item do pedido para refletir a quantidade embalada aprovada:
          const newTotalPrice = prodQuantity * unitPrice;
          await supabase
            .from('order_items')
            .update({
              quantity: prodQuantity,
              total_price: newTotalPrice,
              updated_at: new Date().toISOString()
            })
            .eq('id', orderItemId);

          // Recalcular o valor total do pedido somando todos os itens
          const { data: allOrderItems, error: itemsError } = await supabase
            .from('order_items')
            .select('total_price')
            .eq('order_id', orderId);
          let saleTotal = orderTotal || 0;
          if (!itemsError && allOrderItems) {
            saleTotal = allOrderItems.reduce((sum, item) => sum + item.total_price, 0);
            // Atualizar total do pedido conforme o novo valor
            await supabase
              .from('orders')
              .update({
                total_amount: saleTotal,
                updated_at: new Date().toISOString()
              })
              .eq('id', orderId);
          }

          // Checar se todos os itens do pedido estão aprovados na embalagem
          const allItemsApproved = await checkAllOrderItemsForApproval(orderId);
          if (!allItemsApproved) {
            toast.info('Embalagem aprovada, mas aguarde todos os itens embalados antes de liberar a venda.');
            refreshPackagings();
            return true;
          }

          // Se chegou aqui, todos os itens do pedido estão aprovados em embalagem -> criar venda apenas agora:
          // Verificar se já existe venda
          const { data: existingSale, error: saleCheckError } = await supabase
            .from('sales')
            .select('id')
            .eq('order_id', orderId)
            .maybeSingle();
          if (saleCheckError) console.error('Erro ao verificar venda existente:', saleCheckError);

          if (!existingSale) {
            await supabase
              .from('sales')
              .insert({
                user_id: user?.id,
                order_id: orderId,
                client_id: clientId,
                client_name: clientName,
                total_amount: saleTotal,
                status: 'pending'
              });
            toast.success(`Embalagem aprovada e venda liberada para ${clientName} - Valor: R$ ${saleTotal.toFixed(2)}`);
          } else {
            toast.success('Embalagem aprovada! Venda já existe para este pedido.');
          }
        } else if (packagingData.order_id && packagingData.client_name) {
          // --- FLUXO: Embalagem direta do estoque (venda direta)
          orderId = packagingData.order_id;
          clientId = packagingData.client_id;
          clientName = packagingData.client_name;
          
          // Atualizar a quantidade do item do pedido baseado na quantidade aprovada na embalagem
          const finalQuantity = quantityPackaged || packagingData.quantity_packaged || packagingData.quantity_to_package;
          
          // Buscar o item do pedido correspondente a este produto
          const { data: orderItemData, error: orderItemError } = await supabase
            .from('order_items')
            .select('id, unit_price, quantity')
            .eq('order_id', orderId)
            .eq('product_id', packagingData.product_id)
            .single();
          
          if (!orderItemError && orderItemData) {
            // Atualizar quantidade e valor do item do pedido
            const newTotalPrice = finalQuantity * orderItemData.unit_price;
            await supabase
              .from('order_items')
              .update({
                quantity: finalQuantity,
                total_price: newTotalPrice,
                updated_at: new Date().toISOString()
              })
              .eq('id', orderItemData.id);
            
            console.log(`Item do pedido atualizado: ${orderItemData.quantity} -> ${finalQuantity} unidades`);
            
            if (finalQuantity < orderItemData.quantity) {
              toast.warning(`Quantidade do pedido ajustada: ${orderItemData.quantity} -> ${finalQuantity} unidades`);
            }
          }
          
          // Buscar dados do pedido
          const { data: orderData, error: orderError } = await supabase
            .from('orders')
            .select('order_number, total_amount')
            .eq('id', orderId)
            .single();
          
          if (!orderError && orderData) {
            orderNumber = orderData.order_number;
            orderTotal = orderData.total_amount;
          }
          
          // Verificar se todos os itens do pedido estão aprovados antes de criar venda
          const allItemsApproved = await checkAllOrderItemsForApproval(orderId);
          if (!allItemsApproved) {
            toast.info('Embalagem aprovada! Aguardando aprovação de todos os itens do pedido para liberar venda.');
            refreshPackagings();
            return true;
          }
          
          // Verificar se já existe uma venda para este pedido
          const { data: existingSale, error: saleCheckError } = await supabase
            .from('sales')
            .select('id')
            .eq('order_id', orderId)
            .maybeSingle();
          
          if (saleCheckError) {
            console.error('Erro ao verificar venda existente:', saleCheckError);
          }
          
          if (!existingSale) {
            // Recalcular o valor total do pedido para a venda
            const { data: finalOrderItems, error: finalItemsError } = await supabase
              .from('order_items')
              .select('total_price')
              .eq('order_id', orderId);
            
            let saleTotal = orderTotal || 0;
            if (!finalItemsError && finalOrderItems) {
              saleTotal = finalOrderItems.reduce((sum, item) => sum + item.total_price, 0);
              // Atualizar total do pedido
              await supabase
                .from('orders')
                .update({
                  total_amount: saleTotal,
                  updated_at: new Date().toISOString()
                })
                .eq('id', orderId);
            }
            
            // Criar nova venda com o valor recalculado
            const { error: saleError } = await supabase
              .from('sales')
              .insert({
                user_id: user?.id,
                order_id: orderId,
                client_id: clientId,
                client_name: clientName,
                total_amount: saleTotal,
                status: 'pending'
              });
            
            if (saleError) {
              console.error('Erro ao criar venda:', saleError);
              toast.error('Erro ao criar venda');
            } else {
              const finalQuantity = quantityPackaged || packagingData.quantity_packaged || packagingData.quantity_to_package;
              console.log(`Venda criada - Cliente: ${clientName}, Quantidade: ${finalQuantity}, Valor: R$ ${saleTotal.toFixed(2)}`);
              toast.success(`Todos os itens aprovados! Venda criada para ${clientName} - Valor: R$ ${saleTotal.toFixed(2)}`);
            }
          } else {
            toast.success('Embalagem aprovada! Venda já existe para este pedido.');
          }
        } else {
          // Embalagem direta do estoque (sem produção)
          const finalQuantity = quantityPackaged || packagingData.quantity_packaged || packagingData.quantity_to_package;
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

  return {
    packagings,
    loading,
    error,
    refreshPackagings,
    updatePackagingStatus
  };
};
