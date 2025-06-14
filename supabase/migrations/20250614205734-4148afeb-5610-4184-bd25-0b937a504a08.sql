
-- 1. (Re)crie a policy para garantir que masters podem excluir empresas
DROP POLICY IF EXISTS "Masters can delete companies" ON public.companies;

CREATE POLICY "Masters can delete companies"
    ON public.companies
    FOR DELETE
    TO authenticated
    USING (public.has_role(auth.uid(), 'master'));

-- 2. Recrie a função delete_company_and_related usando SECURITY DEFINER e logs
CREATE OR REPLACE FUNCTION public.delete_company_and_related(_company_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Debug log
  RAISE NOTICE 'Iniciando exclusão para company_id=%', _company_id;

  -- Excluir tabelas dependentes primeiro
  DELETE FROM public.order_items WHERE order_id IN (SELECT id FROM public.orders WHERE company_id = _company_id);
  DELETE FROM public.orders WHERE company_id = _company_id;
  DELETE FROM public.sales WHERE company_id = _company_id;
  DELETE FROM public.products WHERE company_id = _company_id;
  DELETE FROM public.product_categories WHERE company_id = _company_id;
  DELETE FROM public.product_recipes WHERE company_id = _company_id;
  DELETE FROM public.production WHERE company_id = _company_id;
  DELETE FROM public.packaging WHERE company_id = _company_id;
  DELETE FROM public.purchases WHERE company_id = _company_id;
  DELETE FROM public.purchase_items WHERE company_id = _company_id;
  DELETE FROM public.vehicles WHERE company_id = _company_id;
  DELETE FROM public.route_assignments WHERE company_id = _company_id;
  DELETE FROM public.route_items WHERE company_id = _company_id;
  DELETE FROM public.delivery_routes WHERE company_id = _company_id;
  DELETE FROM public.saas_analytics WHERE company_id = _company_id;
  DELETE FROM public.company_modules WHERE company_id = _company_id;
  DELETE FROM public.clients WHERE company_id = _company_id;
  DELETE FROM public.company_subscriptions WHERE company_id = _company_id;
  DELETE FROM public.vendors WHERE company_id = _company_id;
  DELETE FROM public.financial_entries WHERE company_id = _company_id;
  DELETE FROM public.accounts_payable WHERE company_id = _company_id;
  DELETE FROM public.user_roles WHERE company_id = _company_id;
  DELETE FROM public.profiles WHERE company_id = _company_id;

  -- Exclusão final da empresa
  DELETE FROM public.companies WHERE id = _company_id;

  RAISE NOTICE 'Empresa excluída company_id=%', _company_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.delete_company_and_related(uuid) TO authenticated;
