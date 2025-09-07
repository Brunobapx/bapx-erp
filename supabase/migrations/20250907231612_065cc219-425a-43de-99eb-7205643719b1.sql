-- Add RLS policies for public e-commerce access on products table
CREATE POLICY "Public can view active products for e-commerce"
ON public.products
FOR SELECT
TO anon
USING (is_active = true);

-- Add policy for authenticated users and anon users on clients table for e-commerce
CREATE POLICY "E-commerce can create clients"
ON public.clients
FOR INSERT
TO anon
WITH CHECK (true);

-- Add policy for order creation from e-commerce
CREATE POLICY "E-commerce can create orders"
ON public.orders
FOR INSERT
TO anon
WITH CHECK (true);

-- Add policy for order items creation from e-commerce
CREATE POLICY "E-commerce can create order items"
ON public.order_items
FOR INSERT
TO anon
WITH CHECK (true);