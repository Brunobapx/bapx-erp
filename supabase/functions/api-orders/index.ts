import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import { corsHeaders, validateAuth, createErrorResponse, createSuccessResponse } from '../_shared/auth.ts';

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const { user, error: authError } = await validateAuth(req);
  if (authError) {
    return createErrorResponse(authError, 401);
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);
  const url = new URL(req.url);
  const pathParts = url.pathname.split('/');
  const orderId = pathParts[pathParts.length - 1];

  try {
    switch (req.method) {
      case 'GET':
        if (orderId && orderId !== 'api-orders') {
          // Buscar pedido específico com itens
          const { data: order, error } = await supabase
            .from('orders')
            .select(`
              *,
              order_items(
                id,
                product_id,
                product_name,
                quantity,
                unit_price,
                total_price
              )
            `)
            .eq('id', orderId)
            .single();

          if (error) {
            return createErrorResponse('Pedido não encontrado', 404);
          }

          return createSuccessResponse(order);
        } else {
          // Listar pedidos com filtros
          const status = url.searchParams.get('status');
          const clientId = url.searchParams.get('client_id');
          const dateFrom = url.searchParams.get('date_from');
          const dateTo = url.searchParams.get('date_to');
          const limit = parseInt(url.searchParams.get('limit') || '50');
          const offset = parseInt(url.searchParams.get('offset') || '0');

          let query = supabase
            .from('orders')
            .select('*', { count: 'exact' })
            .range(offset, offset + limit - 1)
            .order('created_at', { ascending: false });

          if (status) {
            query = query.eq('status', status);
          }

          if (clientId) {
            query = query.eq('client_id', clientId);
          }

          if (dateFrom) {
            query = query.gte('created_at', dateFrom);
          }

          if (dateTo) {
            query = query.lte('created_at', dateTo);
          }

          const { data: orders, error, count } = await query;

          if (error) {
            return createErrorResponse('Erro ao buscar pedidos');
          }

          return createSuccessResponse({
            orders,
            total: count,
            limit,
            offset
          });
        }

      case 'POST':
        const orderData = await req.json();
        
        // Validações básicas
        if (!orderData.client_id) {
          return createErrorResponse('Cliente é obrigatório');
        }
        if (!orderData.items || !Array.isArray(orderData.items) || orderData.items.length === 0) {
          return createErrorResponse('Itens do pedido são obrigatórios');
        }

        // Buscar dados do cliente
        const { data: client, error: clientError } = await supabase
          .from('clients')
          .select('name')
          .eq('id', orderData.client_id)
          .single();

        if (clientError) {
          return createErrorResponse('Cliente não encontrado');
        }

        // Buscar empresa do usuário
        const { data: profile } = await supabase
          .from('profiles')
          .select('company_id')
          .eq('id', user!.id)
          .single();

        if (!profile?.company_id) {
          return createErrorResponse('Empresa do usuário não localizada');
        }

        // Calcular total
        const total = orderData.items.reduce((sum: number, item: any) => 
          sum + (item.quantity * item.unit_price), 0
        );

        // Criar pedido
        const { data: newOrder, error: orderError } = await supabase
          .from('orders')
          .insert([{
            user_id: user!.id,
            client_id: orderData.client_id,
            client_name: client.name,
            total_amount: total,
            payment_method: orderData.payment_method,
            payment_term: orderData.payment_term,
            delivery_deadline: orderData.delivery_deadline,
            notes: orderData.notes,
            status: 'pending',
            company_id: profile.company_id
          }])
          .select()
          .single();

        if (orderError) {
          return createErrorResponse('Erro ao criar pedido');
        }

        // Criar itens do pedido
        const orderItems = orderData.items.map((item: any) => ({
          user_id: user!.id,
          order_id: newOrder.id,
          product_id: item.product_id,
          product_name: item.product_name,
          quantity: item.quantity,
          unit_price: item.unit_price,
          total_price: item.quantity * item.unit_price,
          company_id: profile.company_id
        }));

        const { error: itemsError } = await supabase
          .from('order_items')
          .insert(orderItems);

        if (itemsError) {
          // Deletar pedido se falhou ao criar itens
          await supabase.from('orders').delete().eq('id', newOrder.id);
          return createErrorResponse('Erro ao criar itens do pedido');
        }

        return createSuccessResponse(newOrder, 'Pedido criado com sucesso');

      case 'PUT':
        if (!orderId || orderId === 'api-orders') {
          return createErrorResponse('ID do pedido é obrigatório');
        }

        const updateData = await req.json();
        
        // Verificar se é atualização de status
        if (updateData.status && pathParts.includes('status')) {
          const { data: updatedOrder, error: statusError } = await supabase
            .from('orders')
            .update({ status: updateData.status })
            .eq('id', orderId)
            .select()
            .single();

          if (statusError) {
            return createErrorResponse('Erro ao atualizar status do pedido');
          }

          return createSuccessResponse(updatedOrder, 'Status atualizado com sucesso');
        }

        // Atualização geral do pedido
        delete updateData.id;
        delete updateData.user_id;
        delete updateData.order_number;

        const { data: updatedOrder, error: updateError } = await supabase
          .from('orders')
          .update(updateData)
          .eq('id', orderId)
          .select()
          .single();

        if (updateError) {
          return createErrorResponse('Erro ao atualizar pedido');
        }

        return createSuccessResponse(updatedOrder, 'Pedido atualizado com sucesso');

      default:
        return createErrorResponse('Método não permitido', 405);
    }
  } catch (error) {
    console.error('API Orders Error:', error);
    return createErrorResponse('Erro interno do servidor', 500);
  }
});