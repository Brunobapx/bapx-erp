
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { OrderItem } from "../useOrders";

export interface ProductionEntry {
  user_id: string;
  order_item_id: string;
  product_id: string;
  product_name: string;
  quantity_requested: number;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface PackagingEntry {
  user_id: string;
  production_id: null;
  product_id: string;
  product_name: string;
  quantity_to_package: number;
  quantity_packaged: number;
  status: string;
  order_id: string;
  client_id: string;
  client_name: string;
  created_at: string;
  updated_at: string;
}

export const processOrderItems = async (
  orderItems: OrderItem[],
  orderId: string,
  clientId: string,
  clientName: string,
  userId: string
) => {
  const productionEntries: ProductionEntry[] = [];
  const packagingEntries: PackagingEntry[] = [];
  const packagingInfoMsgs: string[] = [];
  let needsProduction = false;
  let hasDirectPackaging = false;

  for (const item of orderItems) {
    console.log(`[FLOW DEBUG] Verificando item: ${item.product_name}, quantidade solicitada: ${item.quantity}`);

    // Buscar dados do produto (estoque e se é fabricado)
    const { data: productData, error: productError } = await supabase
      .from('products')
      .select('stock, is_manufactured')
      .eq('id', item.product_id)
      .single();

    if (productError) {
      console.error('[FLOW DEBUG] Erro ao buscar produto:', productError);
      continue;
    }

    const currentStock = Number(productData.stock) || 0;
    const quantityNeeded = Number(item.quantity);
    const isManufactured = Boolean(productData.is_manufactured);

    console.log(`[FLOW DEBUG] Produto: ${item.product_name}, Estoque atual: ${currentStock}, Necessário: ${quantityNeeded}, É fabricado: ${isManufactured}`);

    if (currentStock >= quantityNeeded) {
      // Todo o pedido pode ser enviado direto para embalagem
      console.log(`[FLOW DEBUG] Enviando ${quantityNeeded} unidades de ${item.product_name} diretamente para embalagem`);
      packagingEntries.push({
        user_id: userId,
        production_id: null,
        product_id: item.product_id,
        product_name: item.product_name,
        quantity_to_package: quantityNeeded,
        quantity_packaged: 0,
        status: 'pending',
        order_id: orderId,
        client_id: clientId,
        client_name: clientName,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });

      // Deduzir a quantidade do estoque
      const { error: stockUpdateError } = await supabase
        .from('products')
        .update({
          stock: currentStock - quantityNeeded,
          updated_at: new Date().toISOString()
        })
        .eq('id', item.product_id);

      if (stockUpdateError) {
        console.error('[FLOW DEBUG] Erro ao atualizar estoque do produto:', stockUpdateError);
        toast.error(`Erro ao atualizar estoque do produto ${item.product_name}`);
      } else {
        console.log(`[FLOW DEBUG] Estoque do produto ${item.product_name} atualizado: ${currentStock} -> ${currentStock - quantityNeeded}`);
      }

      hasDirectPackaging = true;
      packagingInfoMsgs.push(`${item.product_name}: ${quantityNeeded} direto para embalagem (estoque suficiente)`);
    }
    else if (currentStock > 0 && currentStock < quantityNeeded) {
      // Dividir: parte vai para embalagem (estoque), parte vai para produção
      const missingQty = quantityNeeded - currentStock;

      console.log(`[FLOW DEBUG] Dividindo ${item.product_name}: ${currentStock} para embalagem, ${missingQty} para produção`);

      // Enviar o disponível para embalagem
      packagingEntries.push({
        user_id: userId,
        production_id: null,
        product_id: item.product_id,
        product_name: item.product_name,
        quantity_to_package: currentStock,
        quantity_packaged: 0,
        status: 'pending',
        order_id: orderId,
        client_id: clientId,
        client_name: clientName,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });

      // Deduzir apenas o disponível
      const { error: stockUpdateError } = await supabase
        .from('products')
        .update({
          stock: 0,
          updated_at: new Date().toISOString()
        })
        .eq('id', item.product_id);

      if (stockUpdateError) {
        console.error('[FLOW DEBUG] Erro ao atualizar estoque do produto:', stockUpdateError);
        toast.error(`Erro ao atualizar estoque do produto ${item.product_name}`);
      } else {
        console.log(`[FLOW DEBUG] Estoque do produto ${item.product_name} atualizado: ${currentStock} -> 0`);
      }
      hasDirectPackaging = true;

      // Produzir o faltante se produto fabricado
      if (isManufactured) {
        console.log(`[FLOW DEBUG] Enviando ${missingQty} de ${item.product_name} para produção`);
        productionEntries.push({
          user_id: userId,
          order_item_id: item.id,
          product_id: item.product_id,
          product_name: item.product_name,
          quantity_requested: missingQty,
          status: 'pending',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });
        needsProduction = true;
        packagingInfoMsgs.push(
          `${item.product_name}: ${currentStock} para embalagem (estoque disponível), ${missingQty} para produção (falta no estoque)`
        );
      } else {
        packagingInfoMsgs.push(
          `${item.product_name}: ${currentStock} para embalagem (estoque disponível), ${missingQty} não pode ser produzido automaticamente`
        );
        toast.error(`Produto ${item.product_name} tem estoque insuficiente e não é fabricado. Reposição manual necessária para ${missingQty} unidade(s).`);
      }
    }
    else if (currentStock === 0 && isManufactured) {
      // Nenhum em estoque e produto fabricado: tudo para produção
      console.log(`[FLOW DEBUG] Enviando ${quantityNeeded} de ${item.product_name} totalmente para produção (estoque zero)`);
      productionEntries.push({
        user_id: userId,
        order_item_id: item.id,
        product_id: item.product_id,
        product_name: item.product_name,
        quantity_requested: quantityNeeded,
        status: 'pending',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });
      needsProduction = true;
      packagingInfoMsgs.push(`${item.product_name}: ${quantityNeeded} para produção (0 disponível em estoque)`);
    }
    else {
      // Produto não fabricado, sem estoque
      console.log(`[FLOW DEBUG] Produto ${item.product_name} não fabricado e sem estoque`);
      packagingInfoMsgs.push(
        `${item.product_name}: 0 em estoque, ${quantityNeeded} não pode ser produzido`
      );
      toast.error(`Produto ${item.product_name} tem estoque insuficiente e não é fabricado. Reposição manual necessária.`);
    }
  }

  return {
    productionEntries,
    packagingEntries,
    packagingInfoMsgs,
    needsProduction,
    hasDirectPackaging
  };
};
