import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.7'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface OrderData {
  user_id: string;
  client_id: string;
  client_name: string;
  total_amount: number;
  status: string;
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('[TEST-ORDER-INSERT] Starting test order insertion...');
    
    // Get authorization header
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    // Create Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    // Set the user session manually
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    
    if (userError || !user) {
      console.error('[TEST-ORDER-INSERT] Auth error:', userError);
      throw new Error('Authentication failed');
    }

    console.log('[TEST-ORDER-INSERT] User authenticated:', user.id);

    // Get a test client
    const { data: clients, error: clientError } = await supabase
      .from('clients')
      .select('id, name')
      .limit(1);
      
    if (clientError || !clients || clients.length === 0) {
      console.error('[TEST-ORDER-INSERT] Client error:', clientError);
      throw new Error('No clients found for test');
    }

    const testClient = clients[0];
    console.log('[TEST-ORDER-INSERT] Test client:', testClient);

    // Prepare order data
    const orderData: OrderData = {
      user_id: user.id,
      client_id: testClient.id,
      client_name: testClient.name,
      total_amount: 29.01,
      status: 'pending'
    };

    console.log('[TEST-ORDER-INSERT] Order data:', orderData);

    // Try direct insert using service role
    const { data: insertResult, error: insertError } = await supabase
      .from('orders')
      .insert(orderData)
      .select()
      .single();

    if (insertError) {
      console.error('[TEST-ORDER-INSERT] Insert error:', insertError);
      throw new Error(`Insert failed: ${insertError.message}`);
    }

    console.log('[TEST-ORDER-INSERT] Insert successful:', insertResult);

    return new Response(
      JSON.stringify({
        success: true,
        data: insertResult,
        message: 'Order created successfully via edge function!'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error: any) {
    console.error('[TEST-ORDER-INSERT] Error:', error);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
        details: error.details || null
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});