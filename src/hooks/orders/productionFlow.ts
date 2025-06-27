
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { OrderItem } from "../useOrders";
import { deductIngredientsFromStock } from "./stockDeduction";

/**
 * Envia todos os itens do pedido para produção (respeitando produtos fabricados).
 */
export const sendToProduction = async (orderId: string, refreshOrders: any) => {
  try {
    const { data: { user }, error: userError } = await supabase.auth.getUser();
      
    if (userError || !user) {
      throw new Error('Usuário não autenticado');
    }

    console.log(`[SEND TO PRODUCTION DEBUG] Enviando pedido ${orderId} para produção`);

    // Get order with items
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select(`
        *,
        order_items (*)
      `)
      .eq('id', orderId)
      .single();
      
    if (orderError) {
      console.error('[SEND TO PRODUCTION DEBUG] Erro ao buscar pedido:', orderError);
      throw orderError;
    }
    if (!order) throw new Error('Pedido não encontrado');

    console.log(`[SEND TO PRODUCTION DEBUG] Pedido encontrado:`, order);
    console.log(`[SEND TO PRODUCTION DEBUG] Itens do pedido:`, order.order_items);

    // Create production entries for each order item
    const productionEntries = order.order_items.map((item: OrderItem) => ({
      user_id: user.id,
      order_item_id: item.id,
      product_id: item.product_id,
      product_name: item.product_name,
      quantity_requested: item.quantity,
      status: 'pending',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }));

    console.log(`[SEND TO PRODUCTION DEBUG] Criando entradas de produção:`, productionEntries);

    const { data: createdProductions, error: productionError } = await supabase
      .from('production')
      .insert(productionEntries)
      .select();
      
    if (productionError) {
      console.error('[SEND TO PRODUCTION DEBUG] Erro ao criar produção:', productionError);
      toast.error(`Erro ao criar registros de produção: ${productionError.message}`);
      throw productionError;
    }

    console.log(`[SEND TO PRODUCTION DEBUG] Produções criadas:`, createdProductions);

    // Abater ingredientes do estoque para cada item de produção criado
    for (const item of order.order_items) {
      // Verificar se o produto é fabricado
      const { data: productData, error: productError } = await supabase
        .from('products')
        .select('is_manufactured')
        .eq('id', item.product_id)
        .single();

      if (productError) {
        console.error('[SEND TO PRODUCTION DEBUG] Erro ao verificar produto:', productError);
        continue;
      }

      // Se for produto fabricado, abater ingredientes
      if (productData.is_manufactured) {
        console.log(`[SEND TO PRODUCTION DEBUG] Produto ${item.product_name} é fabricado, abatendo ingredientes...`);
          
        const stockUpdateSuccess = await deductIngredientsFromStock(
          item.product_id, 
          item.quantity
        );
          
        if (!stockUpdateSuccess) {
          toast.error(`Aviso: Não foi possível atualizar completamente o estoque dos ingredientes para ${item.product_name}`);
        } else {
          console.log(`[SEND TO PRODUCTION DEBUG] Ingredientes abatidos com sucesso para ${item.product_name}`);
        }
      } else {
        console.log(`[SEND TO PRODUCTION DEBUG] Produto ${item.product_name} não é fabricado, pulando abatimento de ingredientes`);
      }
    }

    // Update order status
    const { error: updateError } = await supabase
      .from('orders')
      .update({ 
        status: 'in_production',
        updated_at: new Date().toISOString()
      })
      .eq('id', orderId);
      
    if (updateError) {
      console.error('[SEND TO PRODUCTION DEBUG] Erro ao atualizar status do pedido:', updateError);
      throw updateError;
    }

    console.log(`[SEND TO PRODUCTION DEBUG] Status do pedido atualizado para 'in_production'`);
      
    toast.success('Pedido enviado para produção e ingredientes abatidos do estoque');
    refreshOrders();
    return true;
  } catch (error: any) {
    console.error('[SEND TO PRODUCTION DEBUG] Erro ao enviar para produção:', error);
    toast.error('Erro ao enviar para produção');
    return false;
  }
};
