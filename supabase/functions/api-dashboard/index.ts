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
  const endpoint = pathParts[pathParts.length - 1];

  try {
    if (req.method !== 'GET') {
      return createErrorResponse('Método não permitido', 405);
    }

    switch (endpoint) {
      case 'stats':
        // Estatísticas gerais do dashboard
        const [
          { count: totalOrders },
          { count: totalClients },
          { count: totalProducts },
          { count: pendingOrders },
          { data: revenueData }
        ] = await Promise.all([
          supabase.from('orders').select('*', { count: 'exact', head: true }),
          supabase.from('clients').select('*', { count: 'exact', head: true }),
          supabase.from('products').select('*', { count: 'exact', head: true }),
          supabase.from('orders').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
          supabase.from('orders').select('total_amount, created_at').gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
        ]);

        const monthlyRevenue = revenueData?.reduce((sum, order) => sum + (order.total_amount || 0), 0) || 0;

        return createSuccessResponse({
          total_orders: totalOrders || 0,
          total_clients: totalClients || 0,
          total_products: totalProducts || 0,
          pending_orders: pendingOrders || 0,
          monthly_revenue: monthlyRevenue
        });

      case 'recent-orders':
        const limit = parseInt(url.searchParams.get('limit') || '10');
        
        const { data: recentOrders, error: ordersError } = await supabase
          .from('orders')
          .select('id, order_number, client_name, total_amount, status, created_at')
          .order('created_at', { ascending: false })
          .limit(limit);

        if (ordersError) {
          return createErrorResponse('Erro ao buscar pedidos recentes');
        }

        return createSuccessResponse(recentOrders || []);

      case 'low-stock':
        const threshold = parseInt(url.searchParams.get('threshold') || '10');
        
        const { data: lowStockProducts, error: stockError } = await supabase
          .from('products')
          .select('id, name, sku, stock, unit')
          .lt('stock', threshold)
          .order('stock', { ascending: true });

        if (stockError) {
          return createErrorResponse('Erro ao buscar produtos com estoque baixo');
        }

        return createSuccessResponse(lowStockProducts || []);

      default:
        return createErrorResponse('Endpoint não encontrado', 404);
    }
  } catch (error) {
    console.error('API Dashboard Error:', error);
    return createErrorResponse('Erro interno do servidor', 500);
  }
});