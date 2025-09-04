import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

interface CartItem {
  product_id: string;
  product_name: string;
  quantity: number;
  unit_price: number;
}

interface PaymentRequest {
  items: CartItem[];
  customer: {
    name: string;
    email: string;
    phone?: string;
  };
  shipping_address: {
    recipient_name: string;
    street_address: string;
    number: string;
    complement?: string;
    neighborhood: string;
    city: string;
    state: string;
    zip_code: string;
  };
  shipping_cost: number;
  payment_method: string;
  company_id: string;
}

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

    const { items, customer, shipping_address, shipping_cost, payment_method, company_id }: PaymentRequest = await req.json();

    // Validate stock availability
    for (const item of items) {
      const { data: product } = await supabase
        .from('products')
        .select('stock, is_active, is_direct_sale, company_id')
        .eq('id', item.product_id)
        .eq('company_id', company_id)
        .single();

      if (!product || !product.is_active || !product.is_direct_sale) {
        return new Response(JSON.stringify({ error: `Product ${item.product_name} is not available` }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      if (product.stock < item.quantity) {
        return new Response(JSON.stringify({ error: `Insufficient stock for ${item.product_name}` }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }

    // Check if customer exists or create new one
    let { data: client } = await supabase
      .from('clients')
      .select('id')
      .eq('email', customer.email)
      .eq('company_id', company_id)
      .single();

    if (!client) {
      const { data: newClient, error: clientError } = await supabase
        .from('clients')
        .insert({
          name: customer.name,
          email: customer.email,
          phone: customer.phone,
          type: 'PF',
          company_id: company_id,
          user_id: company_id // Use company_id as user_id for e-commerce clients
        })
        .select('id')
        .single();

      if (clientError) {
        console.error('Error creating client:', clientError);
        return new Response(JSON.stringify({ error: 'Failed to create customer' }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      client = newClient;
    }

    // Create shipping address
    const { data: shippingAddr, error: addressError } = await supabase
      .from('shipping_addresses')
      .insert({
        client_id: client.id,
        ...shipping_address,
        company_id: company_id
      })
      .select('id')
      .single();

    if (addressError) {
      console.error('Error creating shipping address:', addressError);
      return new Response(JSON.stringify({ error: 'Failed to create shipping address' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Calculate total amount
    const itemsTotal = items.reduce((total, item) => total + (item.quantity * item.unit_price), 0);
    const totalAmount = itemsTotal + shipping_cost;

    // Create order
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({
        client_id: client.id,
        client_name: customer.name,
        total_amount: totalAmount,
        status: 'pending',
        payment_method: payment_method,
        user_id: company_id, // Use company_id as user_id for e-commerce orders
        company_id: company_id
      })
      .select('id, order_number')
      .single();

    if (orderError) {
      console.error('Error creating order:', orderError);
      return new Response(JSON.stringify({ error: 'Failed to create order' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Create order items
    const orderItems = items.map(item => ({
      order_id: order.id,
      product_id: item.product_id,
      product_name: item.product_name,
      quantity: item.quantity,
      unit_price: item.unit_price,
      total_price: item.quantity * item.unit_price,
      user_id: company_id,
      company_id: company_id
    }));

    const { error: itemsError } = await supabase
      .from('order_items')
      .insert(orderItems);

    if (itemsError) {
      console.error('Error creating order items:', itemsError);
      return new Response(JSON.stringify({ error: 'Failed to create order items' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Create Mercado Pago preference (mock for now - you'll need to implement actual MP integration)
    const preferenceId = `mp_${order.order_number}_${Date.now()}`;

    // Create e-commerce order record
    const { error: ecomOrderError } = await supabase
      .from('ecommerce_orders')
      .insert({
        order_id: order.id,
        shipping_address_id: shippingAddr.id,
        shipping_cost: shipping_cost,
        payment_method: payment_method,
        customer_email: customer.email,
        customer_phone: customer.phone,
        preference_id: preferenceId,
        company_id: company_id
      });

    if (ecomOrderError) {
      console.error('Error creating e-commerce order:', ecomOrderError);
    }

    return new Response(JSON.stringify({
      order_id: order.id,
      order_number: order.order_number,
      preference_id: preferenceId,
      total_amount: totalAmount,
      // For demo purposes - you'd integrate with actual Mercado Pago API
      checkout_url: `https://sandbox.mercadopago.com.br/checkout/v1/redirect?pref_id=${preferenceId}`
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in create-payment-preference function:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});