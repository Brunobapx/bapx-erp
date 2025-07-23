-- Ajustar política RLS para orders permitir acesso de edge functions
-- A edge function usa service role e precisa acessar todos os pedidos

-- Remover política atual que está muito restritiva
DROP POLICY IF EXISTS "Users can view orders based on role" ON public.orders;

-- Criar nova política mais específica que permite acesso de edge functions
CREATE POLICY "Users can view orders based on role" ON public.orders
FOR SELECT USING (
  -- Service role (edge functions) tem acesso total
  auth.jwt() ->> 'role' = 'service_role' OR
  -- Para usuários autenticados normais
  (
    auth.uid() IS NOT NULL AND (
      -- Admin e master veem tudo
      public.is_admin(auth.uid()) OR
      -- Vendedores só veem seus próprios pedidos (onde seller contém seu nome)
      (public.is_seller(auth.uid()) AND (
        salesperson_id = auth.uid() OR
        seller ILIKE '%' || COALESCE(
          (SELECT user_metadata->>'first_name' FROM auth.users WHERE id = auth.uid()),
          ''
        ) || '%'
      )) OR
      -- Outros usuários veem todos
      (NOT public.is_seller(auth.uid()) AND NOT public.is_admin(auth.uid()))
    )
  )
);