import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    );

    const url = new URL(req.url);
    const searchParams = url.searchParams;
    const productId = searchParams.get('id');
    const category = searchParams.get('category');
    const search = searchParams.get('search');
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = parseInt(searchParams.get('offset') || '0');

    // Get single product
    if (productId) {
      const { data: product, error } = await supabase
        .from('products')
        .select('id, name, description, price, stock, category, is_active, is_direct_sale')
        .eq('id', productId)
        .eq('is_active', true)
        .eq('is_direct_sale', true)
        .single();

      if (error) {
        console.error('Error fetching product:', error);
        return new Response(JSON.stringify({ error: 'Product not found' }), {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      return new Response(JSON.stringify({ product }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Get products list
    let query = supabase
      .from('products')
      .select('id, name, description, price, stock, category, is_active')
      .eq('is_active', true)
      .eq('is_direct_sale', true)
      .gt('stock', 0);

    if (category) {
      query = query.eq('category', category);
    }

    if (search) {
      query = query.or(`name.ilike.%${search}%,description.ilike.%${search}%`);
    }

    const { data: products, error } = await query
      .range(offset, offset + limit - 1)
      .order('name');

    if (error) {
      console.error('Error fetching products:', error);
      return new Response(JSON.stringify({ error: 'Failed to fetch products' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Get categories for filtering
    const { data: categories } = await supabase
      .from('products')
      .select('category')
      .eq('is_active', true)
      .eq('is_direct_sale', true)
      .not('category', 'is', null);

    const uniqueCategories = [...new Set(categories?.map(c => c.category))];

    return new Response(JSON.stringify({ 
      products: products || [], 
      categories: uniqueCategories,
      total: products?.length || 0 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in public-catalog function:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});