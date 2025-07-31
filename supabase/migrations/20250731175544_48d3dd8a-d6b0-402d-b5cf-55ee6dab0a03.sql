-- Remover políticas problemáticas que usam is_admin
DROP POLICY IF EXISTS "Users can delete their own orders or admins can delete any" ON public.orders;
DROP POLICY IF EXISTS "Users can update their own orders or admins can update any" ON public.orders;
DROP POLICY IF EXISTS "Users can insert orders for their company" ON public.orders;

-- Criar políticas mais simples que funcionam
CREATE POLICY "Users can delete their own orders" ON public.orders
FOR DELETE
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own orders" ON public.orders  
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert orders" ON public.orders
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Fazer o mesmo para order_items
DROP POLICY IF EXISTS "Users can delete their own order items or admins can delete any" ON public.order_items;
DROP POLICY IF EXISTS "Users can update their own order items or admins can update any" ON public.order_items;
DROP POLICY IF EXISTS "Users can insert order items for their orders" ON public.order_items;

CREATE POLICY "Users can delete their own order items" ON public.order_items
FOR DELETE
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own order items" ON public.order_items
FOR UPDATE  
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert order items" ON public.order_items
FOR INSERT
WITH CHECK (auth.uid() = user_id);