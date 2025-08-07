-- Criar função para verificar se o usuário é vendedor
CREATE OR REPLACE FUNCTION public.is_seller(user_id uuid DEFAULT auth.uid())
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.user_positions 
    WHERE user_positions.user_id = COALESCE($1, auth.uid()) 
    AND position = 'vendedor'
  );
EXCEPTION
  WHEN OTHERS THEN
    RETURN FALSE;
END;
$$;

-- Atualizar políticas para orders - vendedores só veem seus próprios pedidos
DROP POLICY IF EXISTS "Authenticated users can manage all orders" ON public.orders;

CREATE POLICY "Sellers can only view their own orders"
  ON public.orders
  FOR SELECT TO authenticated
  USING (
    NOT public.is_seller(auth.uid()) OR 
    (public.is_seller(auth.uid()) AND user_id = auth.uid())
  );

CREATE POLICY "Sellers can only manage their own orders"
  ON public.orders
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Sellers can only update their own orders"
  ON public.orders
  FOR UPDATE TO authenticated
  USING (
    NOT public.is_seller(auth.uid()) OR 
    (public.is_seller(auth.uid()) AND user_id = auth.uid())
  );

CREATE POLICY "Sellers can only delete their own orders"
  ON public.orders
  FOR DELETE TO authenticated
  USING (
    NOT public.is_seller(auth.uid()) OR 
    (public.is_seller(auth.uid()) AND user_id = auth.uid())
  );

-- Atualizar políticas para sales - vendedores só veem suas próprias vendas
DROP POLICY IF EXISTS "Authenticated users can manage all sales" ON public.sales;

CREATE POLICY "Sellers can only view their own sales"
  ON public.sales
  FOR SELECT TO authenticated
  USING (
    NOT public.is_seller(auth.uid()) OR 
    (public.is_seller(auth.uid()) AND user_id = auth.uid())
  );

CREATE POLICY "Sellers can only manage their own sales"
  ON public.sales
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Sellers can only update their own sales"
  ON public.sales
  FOR UPDATE TO authenticated
  USING (
    NOT public.is_seller(auth.uid()) OR 
    (public.is_seller(auth.uid()) AND user_id = auth.uid())
  );

CREATE POLICY "Sellers can only delete their own sales"
  ON public.sales
  FOR DELETE TO authenticated
  USING (
    NOT public.is_seller(auth.uid()) OR 
    (public.is_seller(auth.uid()) AND user_id = auth.uid())
  );

-- Atualizar políticas para trocas - vendedores só veem suas próprias trocas
DROP POLICY IF EXISTS "Authenticated users can manage all trocas" ON public.trocas;

CREATE POLICY "Sellers can only view their own trocas"
  ON public.trocas
  FOR SELECT TO authenticated
  USING (
    NOT public.is_seller(auth.uid()) OR 
    (public.is_seller(auth.uid()) AND user_id = auth.uid())
  );

CREATE POLICY "Sellers can only manage their own trocas"
  ON public.trocas
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Sellers can only update their own trocas"
  ON public.trocas
  FOR UPDATE TO authenticated
  USING (
    NOT public.is_seller(auth.uid()) OR 
    (public.is_seller(auth.uid()) AND user_id = auth.uid())
  );

CREATE POLICY "Sellers can only delete their own trocas"
  ON public.trocas
  FOR DELETE TO authenticated
  USING (
    NOT public.is_seller(auth.uid()) OR 
    (public.is_seller(auth.uid()) AND user_id = auth.uid())
  );