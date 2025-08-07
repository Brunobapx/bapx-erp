-- Fix RLS policy for orders table to allow INSERT for authenticated users
DROP POLICY IF EXISTS "Users can manage their own orders" ON public.orders;

-- Create more permissive policies for orders
CREATE POLICY "Authenticated users can insert orders"
ON public.orders FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL AND auth.uid() = user_id);

CREATE POLICY "Authenticated users can view orders"
ON public.orders FOR SELECT
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update their own orders"
ON public.orders FOR UPDATE
USING (auth.uid() IS NOT NULL AND auth.uid() = user_id)
WITH CHECK (auth.uid() IS NOT NULL AND auth.uid() = user_id);

CREATE POLICY "Authenticated users can delete their own orders"
ON public.orders FOR DELETE
USING (auth.uid() IS NOT NULL AND auth.uid() = user_id);