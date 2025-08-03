
import { useState, useEffect } from 'react';
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Production, ProductionStatus } from '@/types/production';

export const useProduction = () => {
  const [productions, setProductions] = useState<Production[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  useEffect(() => {
    const fetchProductions = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        
        if (userError || !user) {
          throw new Error('Usuário não autenticado');
        }

        console.log('[PRODUCTION DEBUG] Iniciando busca de produções para usuário:', user.id);

        // Sistema colaborativo - buscar produções de todos os usuários
        const { data: rawProductions, error: allError } = await supabase
          .from('production')
          .select('*');
          
        console.log('[PRODUCTION DEBUG] Registros brutos na tabela production:', rawProductions);
        console.log('[PRODUCTION DEBUG] Erro na busca bruta:', allError);

        // Buscar produções com pedidos (left join para incluir internas também)
        const { data: ordersProductions, error: ordersError } = await supabase
          .from('production')
          .select(`
            *,
            order_item_tracking!inner(
              order_item_id,
              order_items!inner(
                order_id,
                orders!inner(
                  order_number,
                  client_name
                )
              )
            )
          `)
          .not('order_item_id', 'is', null)
          .order('created_at', { ascending: false });

        // Buscar produções internas (sem order_item_id)
        const { data: internalProductions, error: internalError } = await supabase
          .from('production')
          .select('*')
          .is('order_item_id', null)
          .order('created_at', { ascending: false });
        
        console.log('[PRODUCTION DEBUG] Produções com pedidos:', ordersProductions);
        console.log('[PRODUCTION DEBUG] Produções internas:', internalProductions);
        console.log('[PRODUCTION DEBUG] Erros:', { ordersError, internalError });
        
        if (ordersError) throw ordersError;
        if (internalError) throw internalError;
        
        // Mapear produções de pedidos para incluir order_number e client_name
        const productionsWithOrderInfo = (ordersProductions || []).map(prod => {
          console.log('[PRODUCTION DEBUG] Processando produção de pedido:', prod.id, 'Tracking:', prod.order_item_tracking);
          
          const tracking = prod.order_item_tracking;
          const orderItem = tracking?.order_items;
          const order = orderItem?.orders;
          
          return {
            ...prod,
            order_number: order?.order_number || '',
            client_name: order?.client_name || ''
          };
        });

        // Mapear produções internas
        const internalProductionsWithInfo = (internalProductions || []).map(prod => ({
          ...prod,
          order_number: 'PRODUÇÃO INTERNA',
          client_name: 'Estoque'
        }));

        // Combinar todas as produções
        const allProductions = [...productionsWithOrderInfo, ...internalProductionsWithInfo]
          .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        
        console.log('[PRODUCTION DEBUG] Produções finais processadas:', allProductions);
        
        setProductions(allProductions);
      } catch (error: any) {
        console.error('[PRODUCTION DEBUG] Erro ao carregar produção:', error);
        setError(error.message || 'Erro ao carregar produção');
        toast.error('Erro ao carregar produção');
      } finally {
        setLoading(false);
      }
    };

    fetchProductions();
  }, [refreshTrigger]);

  const refreshProductions = () => {
    console.log('[PRODUCTION DEBUG] Refreshing productions...');
    setRefreshTrigger(prev => prev + 1);
  };

  // Função para abater ingredientes do estoque
  const deductIngredientsFromStock = async (productId: string, quantityProduced: number) => {
    try {
      // Buscar a receita do produto
      const { data: recipe, error: recipeError } = await supabase
        .from('product_recipes')
        .select('ingredient_id, quantity')
        .eq('product_id', productId);

      if (recipeError) {
        console.error('Erro ao buscar receita:', recipeError);
        return false;
      }

      if (!recipe || recipe.length === 0) {
        console.log('Produto não possui receita definida');
        return true; // Não é erro se não tem receita
      }

      // Para cada ingrediente da receita, abater do estoque
      for (const ingredient of recipe) {
        const quantityToDeduct = ingredient.quantity * quantityProduced;
        
        // Buscar estoque atual do ingrediente
        const { data: product, error: productError } = await supabase
          .from('products')
          .select('stock')
          .eq('id', ingredient.ingredient_id)
          .single();

        if (productError) {
          console.error('Erro ao buscar produto:', productError);
          continue;
        }

        const currentStock = product.stock || 0;
        const newStock = Math.max(0, currentStock - quantityToDeduct);

        // Atualizar estoque
        const { error: updateError } = await supabase
          .from('products')
          .update({ stock: newStock })
          .eq('id', ingredient.ingredient_id);

        if (updateError) {
          console.error('Erro ao atualizar estoque:', updateError);
          return false;
        }

        console.log(`Estoque atualizado: ${ingredient.ingredient_id}, quantidade deduzida: ${quantityToDeduct}, novo estoque: ${newStock}`);
      }

      return true;
    } catch (error) {
      console.error('Erro ao abater ingredientes do estoque:', error);
      return false;
    }
  };

  const updateProductionStatus = async (id: string, status: ProductionStatus, quantityProduced?: number) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      const updateData: any = { 
        status,
        updated_at: new Date().toISOString()
      };
      
      if (status === 'in_progress') {
        updateData.start_date = new Date().toISOString().split('T')[0]; 
        
        // Quando inicia a produção, abater ingredientes do estoque
        if (quantityProduced && quantityProduced > 0) {
          // Buscar dados da produção para obter o product_id
          const { data: productionData, error: fetchError } = await supabase
            .from('production')
            .select('product_id')
            .eq('id', id)
            .single();
          
          if (fetchError) {
            console.error('Erro ao buscar dados da produção:', fetchError);
            throw fetchError;
          }
          
          // Abater ingredientes do estoque
          const stockUpdateSuccess = await deductIngredientsFromStock(
            productionData.product_id, 
            quantityProduced
          );
          
          if (!stockUpdateSuccess) {
            toast.error('Aviso: Não foi possível atualizar completamente o estoque dos ingredientes');
          } else {
            toast.success('Produção iniciada e ingredientes deduzidos do estoque');
          }
        }
      }
      
      if (status === 'completed' || status === 'approved') {
        updateData.completion_date = new Date().toISOString().split('T')[0];
        if (quantityProduced !== undefined) {
          updateData.quantity_produced = quantityProduced;
        }
      }
      
      if (status === 'approved') {
        updateData.approved_at = new Date().toISOString();
        updateData.approved_by = user?.email || 'Sistema';
        
        // Garantir que temos a quantidade produzida
        const finalQuantityProduced = quantityProduced || 0;
        if (finalQuantityProduced <= 0) {
          toast.error('Quantidade produzida deve ser maior que zero');
          return false;
        }
        
        updateData.quantity_produced = finalQuantityProduced;
        
        // Primeiro, atualizar a produção com a quantidade produzida
        const { error: updateError } = await supabase
          .from('production')
          .update(updateData)
          .eq('id', id);
        
        if (updateError) throw updateError;
        
        // Buscar dados da produção atualizada incluindo tracking_id
        const { data: productionData, error: fetchError } = await supabase
          .from('production')
          .select('*')
          .eq('id', id)
          .single();
        
        if (fetchError) {
          console.error('Erro ao buscar dados da produção:', fetchError);
          throw fetchError;
        }

        // Verificar se é produção interna (order_item_id é null)
        const isInternalProduction = !productionData.order_item_id;
        
        if (isInternalProduction) {
          // Para produção interna, adicionar direto ao estoque
          const { data: productData, error: productError } = await supabase
            .from('products')
            .select('stock')
            .eq('id', productionData.product_id)
            .single();
          
          if (productError) {
            console.error('Erro ao buscar produto:', productError);
            throw productError;
          }
          
          const currentStock = productData.stock || 0;
          const newStock = currentStock + finalQuantityProduced;
          
          const { error: stockUpdateError } = await supabase
            .from('products')
            .update({ 
              stock: newStock,
              updated_at: new Date().toISOString()
            })
            .eq('id', productionData.product_id);
          
          if (stockUpdateError) {
            console.error('Erro ao atualizar estoque do produto:', stockUpdateError);
            toast.error('Erro ao atualizar estoque do produto');
          } else {
            console.log(`Produção interna aprovada. ${finalQuantityProduced} unidades adicionadas ao estoque. Novo estoque: ${newStock}`);
            toast.success(`Produção interna aprovada! ${finalQuantityProduced} unidades adicionadas ao estoque.`);
          }
          
          refreshProductions();
          return true;
        }
        
        // Para produção de pedidos, usar sistema de tracking
        if (productionData.tracking_id) {
          console.log(`[TRACKING] Atualizando produção aprovada para tracking ${productionData.tracking_id}: ${finalQuantityProduced} unidades`);
          
          // Atualizar tracking com quantidade produzida aprovada
          const { error: trackingError } = await supabase
            .from('order_item_tracking')
            .update({
              quantity_produced_approved: finalQuantityProduced,
              status: 'partial_ready'
            })
            .eq('id', productionData.tracking_id);
            
          if (trackingError) {
            console.error('Erro ao atualizar tracking:', trackingError);
            toast.error('Erro ao atualizar rastreamento do item');
          } else {
            console.log(`[TRACKING] Tracking atualizado: produção aprovada de ${finalQuantityProduced} unidades`);
          }
          
          // Buscar tracking para verificar se precisa criar ou atualizar embalagem
          const { data: trackingData, error: trackingFetchError } = await supabase
            .from('order_item_tracking')
            .select('*')
            .eq('id', productionData.tracking_id)
            .single();
            
          if (trackingFetchError) {
            console.error('Erro ao buscar tracking:', trackingFetchError);
          } else {
            // Calcular quantidade total para embalagem (estoque + produção)
            const totalForPackaging = trackingData.quantity_from_stock + finalQuantityProduced;
            
            console.log(`[TRACKING] Total para embalagem: ${totalForPackaging} (${trackingData.quantity_from_stock} estoque + ${finalQuantityProduced} produção)`);
            
            // Verificar se já existe embalagem para este tracking
            const { data: existingPackaging, error: packagingCheckError } = await supabase
              .from('packaging')
              .select('*')
              .eq('tracking_id', productionData.tracking_id)
              .maybeSingle();
              
            if (packagingCheckError) {
              console.error('Erro ao verificar embalagem existente:', packagingCheckError);
            }
            
            if (existingPackaging) {
              // Atualizar embalagem existente somando a produção aprovada
              const newQuantity = existingPackaging.quantity_to_package + finalQuantityProduced;
              const { error: packagingUpdateError } = await supabase
                .from('packaging')
                .update({
                  quantity_to_package: newQuantity,
                  status: 'pending'
                })
                .eq('id', existingPackaging.id);
                
              if (packagingUpdateError) {
                console.error('Erro ao atualizar embalagem:', packagingUpdateError);
                toast.error('Erro ao atualizar embalagem');
              } else {
                console.log(`[TRACKING] Embalagem atualizada: ${existingPackaging.quantity_to_package} + ${finalQuantityProduced} = ${newQuantity} unidades`);
                toast.success(`Produção aprovada! ${finalQuantityProduced} unidades adicionadas à embalagem (total: ${newQuantity})`);
              }
            } else {
              // Criar nova embalagem com a produção
              if (finalQuantityProduced > 0) {
                // Buscar dados do pedido para criar embalagem
                const { data: orderItem, error: orderItemError } = await supabase
                  .from('order_items')
                  .select(`
                    *,
                    orders!inner(*)
                  `)
                  .eq('id', productionData.order_item_id)
                  .single();
                  
                if (orderItemError) {
                  console.error('Erro ao buscar item do pedido:', orderItemError);
                } else {
                  const { error: packagingCreateError } = await supabase
                    .from('packaging')
                    .insert({
                      user_id: user?.id,
                      order_id: orderItem.orders.id,
                      client_id: orderItem.orders.client_id,
                      client_name: orderItem.orders.client_name,
                      product_id: productionData.product_id,
                      product_name: productionData.product_name,
                      quantity_to_package: finalQuantityProduced,
                      status: 'pending',
                      tracking_id: productionData.tracking_id
                    });
                    
                  if (packagingCreateError) {
                    console.error('Erro ao criar embalagem:', packagingCreateError);
                    toast.error('Erro ao criar registro de embalagem');
                  } else {
                    console.log(`[TRACKING] Nova embalagem criada: ${finalQuantityProduced} unidades da produção`);
                    toast.success(`Produção aprovada! ${finalQuantityProduced} unidades enviadas para embalagem`);
                  }
                }
              }
            }
          }
        }
        
        refreshProductions();
        return true;
      }

      // Para outros status, apenas atualizar a produção normalmente
      const { error } = await supabase
        .from('production')
        .update(updateData)
        .eq('id', id);
      
      if (error) throw error;
      
      toast.success('Status de produção atualizado com sucesso');
      refreshProductions();
      return true;
    } catch (error: any) {
      console.error('Erro ao atualizar produção:', error);
      toast.error('Erro ao atualizar produção');
      return false;
    }
  };

  return {
    productions,
    loading,
    error,
    refreshProductions,
    updateProductionStatus
  };
};
