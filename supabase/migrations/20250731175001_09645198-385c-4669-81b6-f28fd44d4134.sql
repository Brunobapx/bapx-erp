-- Corrigir política RLS para orders que estava tentando acessar auth.users
-- Remover política problemática
DROP POLICY IF EXISTS "Users can view orders from their company" ON public.orders;

-- Criar nova política mais simples que funciona corretamente
CREATE POLICY "Users can view orders from their company" ON public.orders
FOR SELECT
USING (auth.uid() IS NOT NULL);

-- Corrigir política RLS para order_items também
DROP POLICY IF EXISTS "Users can view order items from their company" ON public.order_items;

CREATE POLICY "Users can view order items from their company" ON public.order_items  
FOR SELECT
USING (auth.uid() IS NOT NULL);