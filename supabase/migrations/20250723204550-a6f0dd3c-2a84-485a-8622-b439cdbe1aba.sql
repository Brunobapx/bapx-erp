-- Corrigir política RLS para orders permitir acesso de edge functions
-- A edge function usa service role e precisa acessar todos os pedidos

-- Remover política atual que está muito restritiva
DROP POLICY IF EXISTS "Sellers can only view their own orders" ON public.orders;

-- Criar nova política que permite acesso de edge functions e filtra corretamente para usuários
CREATE POLICY "Users can view orders based on role" ON public.orders
FOR SELECT USING (
  -- Service role (edge functions) tem acesso total
  auth.jwt() ->> 'role' = 'service_role' OR
  -- Para usuários autenticados normais
  (
    auth.uid() IS NOT NULL AND (
      -- Vendedores só veem seus próprios pedidos
      (public.is_seller(auth.uid()) AND user_id = auth.uid()) OR
      -- Não vendedores veem todos
      (NOT public.is_seller(auth.uid()))
    )
  )
);