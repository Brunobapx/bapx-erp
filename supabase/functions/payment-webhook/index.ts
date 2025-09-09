import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
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

    const body = await req.json();
    console.log('Payment webhook received:', body);

    // Extract payment info from webhook (adjust according to your payment provider)
    const { 
      payment_id, 
      preference_id, 
      status, 
      external_reference 
    } = body;

    if (status !== 'approved') {
      console.log('Payment not approved, status:', status);
      return new Response(JSON.stringify({ message: 'Payment not approved' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Find the e-commerce order by preference_id
    const { data: ecomOrder } = await supabase
      .from('ecommerce_orders')
      .select('id, order_id, payment_status')
      .eq('preference_id', preference_id)
      .single();

    if (!ecomOrder) {
      console.error('E-commerce order not found for preference_id:', preference_id);
      return new Response(JSON.stringify({ error: 'Order not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (ecomOrder.payment_status === 'paid') {
      console.log('Order already paid:', ecomOrder.id);
      return new Response(JSON.stringify({ message: 'Already processed' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Update e-commerce order with payment info
    const { error: updateEcomError } = await supabase
      .from('ecommerce_orders')
      .update({
        payment_status: 'paid',
        payment_id: payment_id,
        paid_at: new Date().toISOString()
      })
      .eq('id', ecomOrder.id);

    if (updateEcomError) {
      console.error('Error updating e-commerce order:', updateEcomError);
      return new Response(JSON.stringify({ error: 'Failed to update e-commerce order' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Get order items to reserve stock
    const { data: orderItems } = await supabase
      .from('order_items')
      .select('product_id, quantity')
      .eq('order_id', ecomOrder.order_id);

    // Reserve stock for each product
    for (const item of orderItems || []) {
      const { data: product } = await supabase
        .from('products')
        .select('stock')
        .eq('id', item.product_id)
        .single();

      if (product && product.stock >= item.quantity) {
        // Deduct stock
        const { error: stockError } = await supabase
          .from('products')
          .update({ stock: product.stock - item.quantity })
          .eq('id', item.product_id);

        if (stockError) {
          console.error('Error updating stock for product:', item.product_id, stockError);
        }
      }
    }

    // Update main order status
    const { error: orderError } = await supabase
      .from('orders')
      .update({ status: 'in_production' })
      .eq('id', ecomOrder.order_id);

    if (orderError) {
      console.error('Error updating order status:', orderError);
    }

    // Create financial entry for the sale
    const { data: order } = await supabase
      .from('orders')
      .select('total_amount, client_id, user_id, company_id')
      .eq('id', ecomOrder.order_id)
      .single();

    if (order) {
      const { error: financialError } = await supabase
        .from('financial_entries')
        .insert({
          user_id: order.user_id, // Use dynamic user_id from the order
          type: 'receivable',
          description: `E-commerce sale - Order #${external_reference || ecomOrder.order_id}`,
          amount: order.total_amount,
          due_date: new Date().toISOString().split('T')[0],
          payment_status: 'paid',
          payment_date: new Date().toISOString().split('T')[0],
          client_id: order.client_id,
          order_id: ecomOrder.order_id,
          company_id: order.company_id // Use dynamic company_id from the order
        });

      if (financialError) {
        console.error('Error creating financial entry:', financialError);
      }
    }

    console.log('Payment processed successfully for order:', ecomOrder.order_id);

    return new Response(JSON.stringify({ 
      message: 'Payment processed successfully',
      order_id: ecomOrder.order_id 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in payment-webhook function:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});