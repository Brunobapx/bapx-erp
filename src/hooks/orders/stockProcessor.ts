
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { OrderStatus } from "../useOrders";
import { processOrderItems } from "./stockValidation";
import { deductIngredientsFromStock } from "./stockDeduction";
import { useOrderItemTracking } from "../useOrderItemTracking";

// Função utilitária para criar tracking
const createTrackingRecord = async (
  orderItemId: string,
  quantityTarget: number,
  quantityFromStock: number,
  quantityFromProduction: number,
  userId: string
): Promise<string | null> => {
  try {
    const { data, error } = await supabase
      .from('order_item_tracking')
      .insert({
        order_item_id: orderItemId,
        quantity_target: quantityTarget,
        quantity_from_stock: quantityFromStock,
        quantity_from_production: quantityFromProduction,
        status: 'pending',
        user_id: userId
      })
      .select()
      .single();

    if (error) throw error;
    console.log('[TRACKING] Criado tracking:', data);
    return data.id;
  } catch (error: any) {
    console.error('Erro ao criar tracking:', error);
    return null;
  }
};

/**
 * Função melhorada para processar pedidos com controle de tracking por item
 */
export const checkStockAndSendToProduction = async (orderId: string) => {
  try {
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      throw new Error('Usuário não autenticado');
    }

    console.log(`[FLOW DEBUG] Processando pedido ${orderId} com novo sistema de tracking`);

    // Buscar pedido com itens
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select(`
        *,
        order_items (
          *,
          products (stock, is_manufactured)
        )
      `)
      .eq('id', orderId)
      .single();

    if (orderError || !order) {
      throw new Error('Pedido não encontrado');
    }

    console.log(`[FLOW DEBUG] Pedido encontrado com ${order.order_items?.length || 0} itens`);

    let hasDirectPackaging = false;
    let needsProduction = false;
    const productionEntries: any[] = [];
    const packagingEntries: any[] = [];
    const infoMessages: string[] = [];

    // Processar cada item individualmente
    for (const item of order.order_items || []) {
      const product = item.products;
      const requestedQty = item.quantity;
      const availableStock = product?.stock || 0;
      const isManufactured = product?.is_manufactured || false;

      console.log(`[FLOW DEBUG] Processando item ${item.product_name}: solicitado=${requestedQty}, estoque=${availableStock}, fabricado=${isManufactured}`);

      let qtyFromStock = 0;
      let qtyFromProduction = 0;

      if (requestedQty <= availableStock) {
        // Tem estoque suficiente - vai direto para embalagem
        qtyFromStock = requestedQty;
        qtyFromProduction = 0;
        hasDirectPackaging = true;
        infoMessages.push(`${item.product_name}: ${requestedQty} unidades direto do estoque`);
      } else if (isManufactured) {
        // Produto fabricado - parte do estoque + produção
        qtyFromStock = Math.max(0, availableStock);
        qtyFromProduction = requestedQty - qtyFromStock;
        needsProduction = true;
        
        if (qtyFromStock > 0) {
          hasDirectPackaging = true;
          infoMessages.push(`${item.product_name}: ${qtyFromStock} do estoque + ${qtyFromProduction} para produção`);
        } else {
          infoMessages.push(`${item.product_name}: ${qtyFromProduction} unidades para produção (sem estoque)`);
        }
      } else {
        // Produto não fabricado sem estoque suficiente - erro
        toast.error(`${item.product_name}: estoque insuficiente (${availableStock}/${requestedQty}) e produto não é fabricado`);
        throw new Error(`Estoque insuficiente para ${item.product_name}`);
      }

      // Criar tracking record
      const trackingId = await createTrackingRecord(
        item.id,
        requestedQty,
        qtyFromStock,
        qtyFromProduction,
        user.id
      );

      if (!trackingId) {
        throw new Error(`Falha ao criar tracking para ${item.product_name}`);
      }

      // Criar entrada de produção se necessário
      if (qtyFromProduction > 0) {
        productionEntries.push({
          user_id: user.id,
          order_item_id: item.id,
          product_id: item.product_id,
          product_name: item.product_name,
          quantity_requested: qtyFromProduction,
          status: 'pending',
          tracking_id: trackingId
        });
      }

      // Criar entrada de embalagem para estoque disponível
      if (qtyFromStock > 0) {
        packagingEntries.push({
          user_id: user.id,
          order_id: order.id,
          client_id: order.client_id,
          client_name: order.client_name,
          product_id: item.product_id,
          product_name: item.product_name,
          quantity_to_package: qtyFromStock,
          status: 'pending',
          tracking_id: trackingId
        });

        // Abater do estoque imediatamente
        const { error: stockError } = await supabase
          .from('products')
          .update({ stock: availableStock - qtyFromStock })
          .eq('id', item.product_id);

        if (stockError) {
          console.error('Erro ao abater estoque:', stockError);
          toast.error(`Erro ao abater estoque de ${item.product_name}`);
        } else {
          console.log(`[FLOW DEBUG] Abatido ${qtyFromStock} unidades do estoque de ${item.product_name}`);
        }
      }
    }

    // Criar entradas de produção
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

      // Abater ingredientes para cada produção
      for (const production of createdProductions || []) {
        console.log(`[FLOW DEBUG] Abatendo ingredientes para produção de ${production.quantity_requested} unidades de ${production.product_name}`);
        
        const stockUpdateSuccess = await deductIngredientsFromStock(
          production.product_id,
          production.quantity_requested
        );

        if (!stockUpdateSuccess) {
          toast.error(`Aviso: Não foi possível atualizar completamente o estoque dos ingredientes para ${production.product_name}`);
        }
      }
    }

    // Criar entradas de embalagem
    if (packagingEntries.length > 0) {
      console.log(`[FLOW DEBUG] Criando ${packagingEntries.length} entradas de embalagem`);
      
      const { data: createdPackagings, error: packagingError } = await supabase
        .from('packaging')
        .insert(packagingEntries)
        .select();

      if (packagingError) {
        console.error('[FLOW DEBUG] Erro ao criar embalagem:', packagingError);
        toast.error(`Erro ao criar registros de embalagem: ${packagingError.message}`);
        throw packagingError;
      }

      if (createdPackagings && createdPackagings.length > 0) {
        toast.success(`${createdPackagings.length} item(ns) enviado(s) para embalagem`);
      }
    }

    // Determinar status do pedido
    let newStatus: OrderStatus = 'pending';
    if (hasDirectPackaging && needsProduction) {
      newStatus = 'in_packaging';
    } else if (hasDirectPackaging && !needsProduction) {
      newStatus = 'in_packaging';
    } else if (!hasDirectPackaging && needsProduction) {
      newStatus = 'in_production';
    }

    // Atualizar status do pedido
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
    }

    const message = `Pedido processado:\n${infoMessages.join('\n')}`;
    toast.success(message);
    
    console.log(`[FLOW DEBUG] Pedido ${orderId} processado com sucesso - Status: ${newStatus}`);
    return true;
    
  } catch (error: any) {
    console.error('[FLOW DEBUG] Erro ao processar pedido:', error);
    toast.error('Erro ao processar pedido: ' + error.message);
    return false;
  }
};
