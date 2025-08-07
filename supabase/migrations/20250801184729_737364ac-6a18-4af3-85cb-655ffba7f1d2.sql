-- Corrigir politicas RLS para tabela orders
DROP POLICY IF EXISTS "Enable all operations for authenticated users" ON public.orders;

-- Recriar política correta para orders
CREATE POLICY "Users can manage their own orders"
ON public.orders
FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Verificar se a política de order_items também está correta
DROP POLICY IF EXISTS "Enable all operations for authenticated users" ON public.order_items;

-- Recriar política correta para order_items  
CREATE POLICY "Users can manage their own order items"
ON public.order_items
FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);