import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface OrderItem {
  id: string;
  product_id: string;
  product_name: string;
  quantity: number;
}

interface Order {
  id: string;
  order_number: string;
  status: string;
  order_items: OrderItem[];
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get the authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      console.error('[CANCEL-ORDER] No authorization header');
      return new Response(
        JSON.stringify({ error: 'Authorization required' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verify the user
    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (authError || !user) {
      console.error('[CANCEL-ORDER] Auth error:', authError);
      return new Response(
        JSON.stringify({ error: 'Invalid authorization' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { orderId, reason } = await req.json();

    if (!orderId) {
      return new Response(
        JSON.stringify({ error: 'Order ID is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`[CANCEL-ORDER] Iniciando cancelamento do pedido ${orderId} pelo usuário ${user.id}`);

    // Buscar o pedido com seus itens
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select(`
        *,
        order_items (
          id,
          product_id,
          product_name,
          quantity
        )
      `)
      .eq('id', orderId)
      .single() as { data: Order | null, error: any };

    if (orderError || !order) {
      console.error('[CANCEL-ORDER] Erro ao buscar pedido:', orderError);
      return new Response(
        JSON.stringify({ error: 'Pedido não encontrado' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verificar se o pedido pode ser cancelado
    if (order.status === 'cancelled') {
      return new Response(
        JSON.stringify({ error: 'Pedido já está cancelado' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (['delivered', 'in_delivery'].includes(order.status)) {
      return new Response(
        JSON.stringify({ error: 'Não é possível cancelar pedidos entregues ou em entrega' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`[CANCEL-ORDER] Pedido ${order.order_number} encontrado com ${order.order_items?.length || 0} itens`);

    // Processar devolução dos itens ao estoque
    const stockUpdates = [];
    const stockMovements = [];

    if (order.order_items && order.order_items.length > 0) {
      for (const item of order.order_items) {
        console.log(`[CANCEL-ORDER] Processando item: ${item.product_name} (${item.quantity} unidades)`);

        // Buscar estoque atual do produto
        const { data: product, error: productError } = await supabase
          .from('products')
          .select('stock, name')
          .eq('id', item.product_id)
          .single();

        if (productError || !product) {
          console.error(`[CANCEL-ORDER] Erro ao buscar produto ${item.product_id}:`, productError);
          continue;
        }

        const currentStock = Number(product.stock);
        const newStock = currentStock + item.quantity;

        console.log(`[CANCEL-ORDER] ${product.name}: ${currentStock} -> ${newStock} (devolvendo ${item.quantity})`);

        // Atualizar estoque
        stockUpdates.push({
          id: item.product_id,
          stock: newStock
        });

        // Registrar movimento de estoque
        stockMovements.push({
          user_id: user.id,
          product_id: item.product_id,
          product_name: item.product_name,
          movement_type: 'devolucao_cancelamento',
          quantity: item.quantity,
          previous_stock: currentStock,
          new_stock: newStock,
          reason: `Devolução por cancelamento do pedido ${order.order_number}${reason ? ` - ${reason}` : ''}`,
          reference_id: orderId
        });
      }
    }

    console.log(`[CANCEL-ORDER] Atualizando estoque de ${stockUpdates.length} produtos`);

    // Executar todas as atualizações em uma transação
    const updates = [];

    // Atualizar status do pedido
    updates.push(
      supabase
        .from('orders')
        .update({ 
          status: 'cancelled',
          notes: `${order.notes || ''}\nCancelado em ${new Date().toLocaleString('pt-BR')}${reason ? ` - Motivo: ${reason}` : ''}`
        })
        .eq('id', orderId)
    );

    // Atualizar estoque dos produtos
    for (const update of stockUpdates) {
      updates.push(
        supabase
          .from('products')
          .update({ stock: update.stock })
          .eq('id', update.id)
      );
    }

    // Registrar movimentos de estoque
    if (stockMovements.length > 0) {
      updates.push(
        supabase
          .from('stock_movements')
          .insert(stockMovements)
      );
    }

    // Executar todas as atualizações
    const results = await Promise.all(updates);
    
    // Verificar se houve erros
    const errors = results.filter(result => result.error);
    if (errors.length > 0) {
      console.error('[CANCEL-ORDER] Erros durante atualização:', errors);
      return new Response(
        JSON.stringify({ error: 'Erro ao processar cancelamento' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`[CANCEL-ORDER] Pedido ${order.order_number} cancelado com sucesso`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Pedido ${order.order_number} cancelado com sucesso`,
        stockUpdates: stockUpdates.length,
        stockMovements: stockMovements.length
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('[CANCEL-ORDER] Erro geral:', error);
    return new Response(
      JSON.stringify({ error: 'Erro interno do servidor' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});