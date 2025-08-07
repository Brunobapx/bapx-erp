
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { OrderStatus } from "../useOrders";
import { processOrderItems } from "./stockValidation";
import { deductIngredientsFromStock } from "./stockDeduction";

/**
 * Função para dividir estoque e enviar diretamente itens para embalagem e produção conforme o disponível.
 */
export const checkStockAndSendToProduction = async (orderId: string) => {
  try {
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      throw new Error('Usuário não autenticado');
    }

    console.log(`[FLOW DEBUG] Verificando estoque para pedido ${orderId}`);

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
      console.error('[FLOW DEBUG] Erro ao buscar pedido:', orderError);
      throw orderError;
    }
    if (!order) throw new Error('Pedido não encontrado');

    console.log(`[FLOW DEBUG] Pedido encontrado:`, order);
    console.log(`[FLOW DEBUG] Itens do pedido:`, order.order_items);

    // Process order items and determine distribution
    const {
      productionEntries,
      packagingEntries,
      packagingInfoMsgs,
      needsProduction,
      hasDirectPackaging
    } = await processOrderItems(
      order.order_items,
      order.id,
      order.client_id,
      order.client_name,
      user.id
    );

    console.log(`[FLOW DEBUG] Resumo: needsProduction=${needsProduction}, hasDirectPackaging=${hasDirectPackaging}`);
    console.log(`[FLOW DEBUG] Entradas de produção a serem criadas:`, productionEntries);
    console.log(`[FLOW DEBUG] Entradas de embalagem a serem criadas:`, packagingEntries);

    // Criar entradas de produção se necessário
    if (productionEntries.length > 0) {
      console.log(`[FLOW DEBUG] Criando ${productionEntries.length} entradas de produção`);

      const { data: createdProductions, error: productionError } = await supabase
        .from('production')
        .insert(productionEntries)
        .select();

      if (productionError) {
        console.error('[FLOW DEBUG] Erro ao criar produção:', productionError);
        toast.error(`Erro ao criar registros de produção: ${productionError.message}`);
        throw productionError;
      }

      console.log(`[FLOW DEBUG] Criadas ${createdProductions?.length || 0} entradas de produção:`, createdProductions);

      // Abater ingredientes para cada entrada de produção criada
      for (const production of createdProductions || []) {
        console.log(`[FLOW DEBUG] Abatendo ingredientes para produção de ${production.quantity_requested} unidades de ${production.product_name}`);

        const stockUpdateSuccess = await deductIngredientsFromStock(
          production.product_id,
          production.quantity_requested
        );

        if (!stockUpdateSuccess) {
          toast.error(`Aviso: Não foi possível atualizar completamente o estoque dos ingredientes para ${production.product_name}`);
        } else {
          console.log(`[FLOW DEBUG] Ingredientes abatidos com sucesso para ${production.product_name}`);
        }
      }
    }

    // Criar entradas de embalagem se necessário
    if (packagingEntries.length > 0) {
      console.log(`[FLOW DEBUG] Criando ${packagingEntries.length} entradas de embalagem`);

      const { data: createdPackagings, error: packagingError } = await supabase
        .from('packaging')
        .insert(packagingEntries)
        .select();

      if (packagingError) {
        console.error('[FLOW DEBUG] Erro ao criar entradas de embalagem:', packagingError);
        toast.error(`Erro ao criar registros de embalagem: ${packagingError.message}`);
        throw packagingError;
      }

      console.log(`[FLOW DEBUG] Criadas ${createdPackagings?.length || 0} entradas de embalagem`);
    }

    // Atualizar status do pedido baseado no que foi criado
    let newStatus: OrderStatus = 'pending';
    let message = '';

    if (hasDirectPackaging && needsProduction) {
      newStatus = 'in_packaging';
      message = `Itens enviados: \n${packagingInfoMsgs.join('\n')}\nItens enviados para embalagem (estoque disponível) e itens para produção (falta de estoque).`;
    } else if (hasDirectPackaging && !needsProduction) {
      newStatus = 'in_packaging';
      message = `Itens enviados direto para embalagem:\n${packagingInfoMsgs.join('\n')}`;
    } else if (!hasDirectPackaging && needsProduction) {
      newStatus = 'in_production';
      message = `Itens enviados para produção devido à falta de estoque:\n${packagingInfoMsgs.join('\n')}`;
    } else {
      message = 'Pedido processado com sucesso!';
    }

    console.log(`[FLOW DEBUG] Atualizando status do pedido para: ${newStatus}`);

    const { error: updateError } = await supabase
      .from('orders')
      .update({
        status: newStatus,
        updated_at: new Date().toISOString()
      })
      .eq('id', orderId);

    if (updateError) {
      console.error('[FLOW DEBUG] Erro ao atualizar status do pedido:', updateError);
      toast.error(`Erro ao atualizar status do pedido: ${updateError.message}`);
    } else {
      console.log(`[FLOW DEBUG] Status do pedido atualizado com sucesso para: ${newStatus}`);
    }

    toast.success(message);
    return true;
  } catch (error: any) {
    console.error('[FLOW DEBUG] Erro ao verificar estoque e processar pedido:', error);
    toast.error('Erro ao processar verificação de estoque');
    return false;
  }
};
