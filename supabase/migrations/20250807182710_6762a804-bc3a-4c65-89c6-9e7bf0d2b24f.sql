-- Temporarily modify orders RLS policy to allow authenticated users to create orders
DROP POLICY IF EXISTS "orders_seller_access" ON orders;

-- Create a temporary more permissive policy for debugging
CREATE POLICY "orders_authenticated_access" 
ON orders 
FOR ALL 
USING (auth.uid() IS NOT NULL) 
WITH CHECK (auth.uid() IS NOT NULL);

-- Also check order_items policy
DROP POLICY IF EXISTS "order_items_seller_access" ON order_items;

CREATE POLICY "order_items_authenticated_access" 
ON order_items 
FOR ALL 
USING (auth.uid() IS NOT NULL) 
WITH CHECK (auth.uid() IS NOT NULL);