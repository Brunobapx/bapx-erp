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
  const productId = pathParts[pathParts.length - 1];

  try {
    switch (req.method) {
      case 'GET':
        if (productId && productId !== 'api-products') {
          // Buscar produto específico
          const { data: product, error } = await supabase
            .from('products')
            .select('*')
            .eq('id', productId)
            .single();

          if (error) {
            return createErrorResponse('Produto não encontrado', 404);
          }

          return createSuccessResponse(product);
        } else if (pathParts.includes('search')) {
          // Buscar produtos
          const q = url.searchParams.get('q') || '';
          const limit = parseInt(url.searchParams.get('limit') || '20');

          if (!q) {
            return createErrorResponse('Parâmetro de busca é obrigatório');
          }

          const { data: products, error } = await supabase
            .from('products')
            .select('id, name, sku, price, stock, unit')
            .or(`name.ilike.%${q}%,sku.ilike.%${q}%,code.ilike.%${q}%`)
            .limit(limit)
            .order('name');

          if (error) {
            return createErrorResponse('Erro ao buscar produtos');
          }

          return createSuccessResponse(products);
        } else {
          // Listar produtos com filtros
          const category = url.searchParams.get('category');
          const lowStock = url.searchParams.get('low_stock') === 'true';
          const limit = parseInt(url.searchParams.get('limit') || '50');
          const offset = parseInt(url.searchParams.get('offset') || '0');

          let query = supabase
            .from('products')
            .select('*', { count: 'exact' })
            .range(offset, offset + limit - 1)
            .order('name');

          if (category) {
            query = query.eq('category', category);
          }

          if (lowStock) {
            query = query.lt('stock', 10); // Considerando estoque baixo como < 10
          }

          const { data: products, error, count } = await query;

          if (error) {
            return createErrorResponse('Erro ao buscar produtos');
          }

          return createSuccessResponse({
            products,
            total: count,
            limit,
            offset
          });
        }

      case 'PUT':
        if (!productId || productId === 'api-products') {
          return createErrorResponse('ID do produto é obrigatório');
        }

        const updateData = await req.json();
        
        // Verificar se é atualização de estoque
        if (updateData.stock !== undefined && pathParts.includes('stock')) {
          const { data: updatedProduct, error: stockError } = await supabase
            .from('products')
            .update({ stock: updateData.stock })
            .eq('id', productId)
            .select()
            .single();

          if (stockError) {
            return createErrorResponse('Erro ao atualizar estoque');
          }

          return createSuccessResponse(updatedProduct, 'Estoque atualizado com sucesso');
        }

        // Atualização geral do produto
        delete updateData.id;
        delete updateData.user_id;

        const { data: updatedProduct, error: updateError } = await supabase
          .from('products')
          .update(updateData)
          .eq('id', productId)
          .select()
          .single();

        if (updateError) {
          return createErrorResponse('Erro ao atualizar produto');
        }

        return createSuccessResponse(updatedProduct, 'Produto atualizado com sucesso');

      default:
        return createErrorResponse('Método não permitido', 405);
    }
  } catch (error) {
    console.error('API Products Error:', error);
    return createErrorResponse('Erro interno do servidor', 500);
  }
});