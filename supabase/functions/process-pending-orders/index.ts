import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.7'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  console.log('[PROCESS-ORDERS] Função iniciada');

  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    console.log('[PROCESS-ORDERS] Cliente Supabase criado');

    // Verificar se há order_id específico no body
    let targetOrderId = null;
    try {
      const body = await req.json();
      targetOrderId = body?.order_id;
    } catch (e) {
      // Ignore JSON parse errors
    }

    // Buscar pedidos pendentes (ou pedido específico)
    let ordersQuery = supabase
      .from('orders')
      .select(`
        id,
        order_number,
        status,
        user_id,
        order_items!inner (
          id,
          product_id,
          product_name,
          quantity
        )
      `)
      .eq('status', 'pending');

    if (targetOrderId) {
      console.log(`[PROCESS-ORDERS] Processando pedido específico: ${targetOrderId}`);
      ordersQuery = ordersQuery.eq('id', targetOrderId);
    }

    const { data: pendingOrders, error: ordersError } = await ordersQuery;

    if (ordersError) {
      throw new Error(`Erro ao buscar pedidos: ${ordersError.message}`);
    }

    console.log(`[PROCESS-ORDERS] Encontrados ${pendingOrders?.length || 0} pedidos pendentes`);

    const results = [];

    for (const order of pendingOrders || []) {
      try {
        console.log(`[PROCESS-ORDERS] Processando pedido ${order.order_number} (${order.id})`);
        
        const processingResults = [];

        for (const item of order.order_items || []) {
          // Buscar detalhes do produto separadamente
          const { data: product, error: productError } = await supabase
            .from('products')
            .select('stock, is_manufactured, is_direct_sale')
            .eq('id', item.product_id)
            .single();

          if (productError || !product) {
            console.error(`[PROCESS-ORDERS] Erro ao buscar produto ${item.product_id}:`, productError);
            continue;
          }

          console.log(`[PROCESS-ORDERS] Processando item ${item.product_name} - Quantidade: ${item.quantity}, Estoque: ${product.stock}, Fabricado: ${product.is_manufactured}, Venda Direta: ${product.is_direct_sale}`);

          let quantityFromStock = 0;
          let quantityFromProduction = 0;

          // Determinar quantidades baseado na nova lógica
          if (product.is_direct_sale) {
            // Produto de venda direta - usar estoque disponível, zero produção
            quantityFromStock = Math.min(item.quantity, product.stock);
            quantityFromProduction = 0;
          } else if (product.is_manufactured) {
            // Produto fabricado - distribuir entre estoque e produção
            quantityFromStock = Math.min(item.quantity, product.stock);
            quantityFromProduction = Math.max(0, item.quantity - product.stock);
          } else {
            // Produto normal - usar estoque disponível apenas
            quantityFromStock = Math.min(item.quantity, product.stock);
            quantityFromProduction = 0;
          }

          console.log(`[PROCESS-ORDERS] Item ${item.product_name}: Stock=${quantityFromStock}, Production=${quantityFromProduction}`);

          // Verificar se já existe tracking para este item
          const { data: existingTracking, error: trackingCheckError } = await supabase
            .from('order_item_tracking')
            .select('*')
            .eq('order_item_id', item.id)
            .maybeSingle();

          let tracking;
          if (existingTracking) {
            console.log(`[PROCESS-ORDERS] Tracking já existe para item ${item.id}, usando existente`);
            tracking = existingTracking;
          } else {
            // Criar registro de tracking
            const { data: newTracking, error: trackingError } = await supabase
              .from('order_item_tracking')
              .insert({
                order_item_id: item.id,
                user_id: order.user_id, // Usar o user_id do pedido
                quantity_target: item.quantity,
                quantity_from_stock: quantityFromStock,
                quantity_from_production: quantityFromProduction,
                status: 'pending'
              })
              .select()
              .single();

            if (trackingError) {
              console.error(`[PROCESS-ORDERS] Erro ao criar tracking: ${trackingError.message}`);
              continue;
            }
            tracking = newTracking;
          }

          console.log(`[PROCESS-ORDERS] Tracking ID: ${tracking.id}`);

          // Criar produção se necessário
          if (quantityFromProduction > 0) {
            const { data: production, error: productionError } = await supabase
              .from('production')
              .insert({
                user_id: order.user_id,
                order_item_id: item.id,
                product_id: item.product_id,
                product_name: item.product_name,
                quantity_requested: quantityFromProduction,
                status: 'pending',
                tracking_id: tracking.id
              })
              .select()
              .single();

            if (productionError) {
              console.error(`[PROCESS-ORDERS] Erro ao criar produção: ${productionError.message}`);
            } else {
              console.log(`[PROCESS-ORDERS] Produção criada: ${production.production_number}`);
            }
          }

          // Criar embalagem se há estoque
          if (quantityFromStock > 0) {
            const { data: packaging, error: packagingError } = await supabase
              .from('packaging')
              .insert({
                user_id: order.user_id,
                product_id: item.product_id,
                product_name: item.product_name,
                quantity_to_package: quantityFromStock,
                status: 'pending',
                order_id: order.id,
                client_id: order.client_id,
                client_name: order.client_name,
                tracking_id: tracking.id
              })
              .select()
              .single();

            if (packagingError) {
              console.error(`[PROCESS-ORDERS] Erro ao criar embalagem: ${packagingError.message}`);
            } else {
              console.log(`[PROCESS-ORDERS] Embalagem criada: ${packaging.packaging_number}`);
            }
          }

          processingResults.push({
            item_id: item.id,
            product_name: item.product_name,
            quantity_from_stock: quantityFromStock,
            quantity_from_production: quantityFromProduction,
            tracking_id: tracking.id
          });
        }

        // Atualizar status do pedido
        let newStatus = 'pending';
        if (processingResults.some(r => r.quantity_from_production > 0)) {
          newStatus = 'in_production';
        } else if (processingResults.some(r => r.quantity_from_stock > 0)) {
          newStatus = 'in_packaging';
        }

        const { error: updateError } = await supabase
          .from('orders')
          .update({ status: newStatus })
          .eq('id', order.id);

        if (updateError) {
          console.error(`[PROCESS-ORDERS] Erro ao atualizar pedido: ${updateError.message}`);
        }

        results.push({
          order_id: order.id,
          order_number: order.order_number,
          new_status: newStatus,
          items_processed: processingResults.length,
          details: processingResults
        });

        console.log(`[PROCESS-ORDERS] Pedido ${order.order_number} processado - Status: ${newStatus}`);

      } catch (error) {
        console.error(`[PROCESS-ORDERS] Erro ao processar pedido ${order.order_number}:`, error);
        results.push({
          order_id: order.id,
          order_number: order.order_number,
          error: error.message
        });
      }
    }

    console.log('[PROCESS-ORDERS] Processamento concluído');

    return new Response(
      JSON.stringify({ 
        success: true, 
        processed_orders: results.length,
        results: results
      }),
      { 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        },
        status: 200 
      }
    )

  } catch (error) {
    console.error('[PROCESS-ORDERS] Erro geral:', error)
    return new Response(
      JSON.stringify({ 
        error: error.message,
        success: false 
      }),
      { 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        },
        status: 500 
      }
    )
  }
})