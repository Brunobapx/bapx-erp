-- Criar políticas RLS mais permissivas temporariamente para debugging
-- Remover políticas existentes
DROP POLICY IF EXISTS "Sellers can only delete their own orders" ON public.orders;
DROP POLICY IF EXISTS "Sellers can only manage their own orders" ON public.orders;
DROP POLICY IF EXISTS "Sellers can only update their own orders" ON public.orders;
DROP POLICY IF EXISTS "Users can view orders based on role" ON public.orders;

-- Criar políticas mais simples e permissivas
CREATE POLICY "Authenticated users can insert orders" 
ON public.orders 
FOR INSERT 
TO authenticated 
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can select orders" 
ON public.orders 
FOR SELECT 
TO authenticated 
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update orders" 
ON public.orders 
FOR UPDATE 
TO authenticated 
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can delete orders" 
ON public.orders 
FOR DELETE 
TO authenticated 
USING (auth.uid() IS NOT NULL);

-- Verificar e atualizar políticas para order_items também
DROP POLICY IF EXISTS "Authenticated users can manage all order items" ON public.order_items;

CREATE POLICY "Authenticated users can manage order items" 
ON public.order_items 
FOR ALL 
TO authenticated 
USING (auth.uid() IS NOT NULL)
WITH CHECK (auth.uid() IS NOT NULL);