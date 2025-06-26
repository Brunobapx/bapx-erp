
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import type { Order, OrderStatus, OrderItem } from "../useOrders";

/**
 * Função para abater ingredientes do estoque conforme a receita do produto.
 */
export const deductIngredientsFromStock = async (productId: string, quantityProduced: number) => {
  try {
    console.log(`[STOCK DEBUG] Iniciando abatimento para produto ${productId}, quantidade: ${quantityProduced}`);
      
    // Buscar a receita do produto
    const { data: recipe, error: recipeError } = await supabase
      .from('product_recipes')
      .select('ingredient_id, quantity')
      .eq('product_id', productId);

    if (recipeError) {
      console.error('[STOCK DEBUG] Erro ao buscar receita:', recipeError);
      return false;
    }

    if (!recipe || recipe.length === 0) {
      console.log('[STOCK DEBUG] Produto não possui receita definida');
      return true; // Não é erro se não tem receita
    }

    console.log('[STOCK DEBUG] Receita encontrada:', recipe);

    // Para cada ingrediente da receita, abater do estoque
    for (const ingredient of recipe) {
      const quantityToDeduct = ingredient.quantity * quantityProduced;
        
      console.log(`[STOCK DEBUG] Abatendo ingrediente ${ingredient.ingredient_id}: ${quantityToDeduct}`);
        
      // Buscar estoque atual do ingrediente
      const { data: product, error: productError } = await supabase
        .from('products')
        .select('stock')
        .eq('id', ingredient.ingredient_id)
        .single();

      if (productError) {
        console.error('[STOCK DEBUG] Erro ao buscar produto:', productError);
        continue;
      }

      const currentStock = product.stock || 0;
      const newStock = Math.max(0, currentStock - quantityToDeduct);

      console.log(`[STOCK DEBUG] Estoque atual: ${currentStock}, novo estoque: ${newStock}`);

      // Atualizar estoque
      const { error: updateError } = await supabase
        .from('products')
        .update({ stock: newStock })
        .eq('id', ingredient.ingredient_id);

      if (updateError) {
        console.error('[STOCK DEBUG] Erro ao atualizar estoque:', updateError);
        return false;
      }

      console.log(`[STOCK DEBUG] Estoque atualizado com sucesso para ${ingredient.ingredient_id}`);
    }

    return true;
  } catch (error) {
    console.error('[STOCK DEBUG] Erro ao abater ingredientes do estoque:', error);
    return false;
  }
};

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

    let needsProduction = false;
    let hasDirectPackaging = false;
    const productionEntries = [];
    const packagingEntries = [];
    const packagingInfoMsgs: string[] = [];

    // Para cada item do pedido, verificar estoque e dividir entre embalagem e produção se estoque for parcial
    for (const item of order.order_items) {
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
          user_id: user.id,
          production_id: null,
          product_id: item.product_id,
          product_name: item.product_name,
          quantity_to_package: quantityNeeded,
          quantity_packaged: 0,
          status: 'pending',
          order_id: order.id,
          client_id: order.client_id,
          client_name: order.client_name
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
          user_id: user.id,
          production_id: null,
          product_id: item.product_id,
          product_name: item.product_name,
          quantity_to_package: currentStock,
          quantity_packaged: 0,
          status: 'pending',
          order_id: order.id,
          client_id: order.client_id,
          client_name: order.client_name
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
            user_id: user.id,
            order_item_id: item.id,
            product_id: item.product_id,
            product_name: item.product_name,
            quantity_requested: missingQty,
            status: 'pending'
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
          user_id: user.id,
          order_item_id: item.id,
          product_id: item.product_id,
          product_name: item.product_name,
          quantity_requested: quantityNeeded,
          status: 'pending'
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

    console.log(`[FLOW DEBUG] Resumo: needsProduction=${needsProduction}, hasDirectPackaging=${hasDirectPackaging}`);
    console.log(`[FLOW DEBUG] Entradas de produção a serem criadas:`, productionEntries);
    console.log(`[FLOW DEBUG] Entradas de embalagem a serem criadas:`, packagingEntries);

    // Criar entradas de produção se necessário
    if (productionEntries.length > 0) {
      console.log(`[FLOW DEBUG] Criando ${productionEntries.length} entradas de produção`);
      
      // Adicionar validação dos dados obrigatórios
      const validProductionEntries = productionEntries.map(entry => ({
        ...entry,
        company_id: null, // Será preenchido pela função padrão do banco
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }));

      console.log(`[FLOW DEBUG] Dados de produção validados:`, validProductionEntries);

      const { data: createdProductions, error: productionError } = await supabase
        .from('production')
        .insert(validProductionEntries)
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
      
      const validPackagingEntries = packagingEntries.map(entry => ({
        ...entry,
        company_id: null, // Será preenchido pela função padrão do banco
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }));

      const { data: createdPackagings, error: packagingError } = await supabase
        .from('packaging')
        .insert(validPackagingEntries)
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

/**
 * Envia todos os itens do pedido para produção (respeitando produtos fabricados).
 */
export const sendToProduction = async (orderId: string, deductIngredientsFromStock: any, refreshOrders: any) => {
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
      company_id: null, // Será preenchido pela função padrão do banco
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
