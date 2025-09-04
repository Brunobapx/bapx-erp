import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const url = new URL(req.url);
    const searchParams = url.searchParams;
    
    // Handle POST requests with body
    let body = {};
    if (req.method === 'POST') {
      try {
        body = await req.json();
      } catch (e) {
        console.error('Error parsing JSON body:', e);
      }
    }

    const productId = searchParams.get('id');
    const category = searchParams.get('category');
    const search = searchParams.get('search');
    const companyId = searchParams.get('company_id');
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = parseInt(searchParams.get('offset') || '0');
    
    // New parameters for company info
    const companyCode = body.company_code || searchParams.get('company_code');
    const getCompanyInfo = body.get_company_info || searchParams.get('get_company_info');

    // Handle company info request
    if (getCompanyInfo && companyCode) {
      console.log('Fetching company info for code:', companyCode);
      
      // Get company by code
      const { data: companyData, error: companyError } = await supabase
        .from('companies')
        .select('*')
        .eq('code', companyCode)
        .single();

      if (companyError || !companyData) {
        console.error('Company not found:', companyError);
        return new Response(
          JSON.stringify({ error: 'Empresa não encontrada' }),
          {
            status: 404,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        );
      }

      // Get ecommerce settings
      const { data: ecommerceData, error: ecommerceError } = await supabase
        .from('company_ecommerce_settings')
        .select('*')
        .eq('company_id', companyData.id)
        .eq('is_active', true)
        .single();

      if (ecommerceError || !ecommerceData) {
        console.error('E-commerce settings not found:', ecommerceError);
        return new Response(
          JSON.stringify({ error: 'Loja não encontrada ou inativa' }),
          {
            status: 404,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        );
      }

      return new Response(
        JSON.stringify({
          company: companyData,
          ecommerce_settings: ecommerceData
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Get single product
    if (productId) {
      let query = supabase
        .from('products')
        .select('id, name, description, price, stock, category, is_active, is_direct_sale')
        .eq('id', productId)
        .eq('is_active', true)
        .eq('is_direct_sale', true);

      if (companyId) {
        query = query.eq('company_id', companyId);
      }

      const { data: product, error } = await query.single();

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

    if (companyId) {
      query = query.eq('company_id', companyId);
    }

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
    let categoriesQuery = supabase
      .from('products')
      .select('category')
      .eq('is_active', true)
      .eq('is_direct_sale', true)
      .not('category', 'is', null);

    if (companyId) {
      categoriesQuery = categoriesQuery.eq('company_id', companyId);
    }

    const { data: categories } = await categoriesQuery;

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