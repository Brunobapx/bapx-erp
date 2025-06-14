
-- Corrige a ordem de deleção na função delete_company_and_related
-- para evitar erro de foreign key ao excluir empresas.

CREATE OR REPLACE FUNCTION public.delete_company_and_related(_company_id uuid)
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  -- Excluir as tabelas com FKs que dependem primeiro de companies / profiles
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

  -- Excluir user_roles antes dos profiles para não violar FK
  DELETE FROM public.user_roles WHERE company_id = _company_id;
  -- Excluir profiles que pertencem à empresa
  DELETE FROM public.profiles WHERE company_id = _company_id;

  -- Excluir a própria empresa por último
  DELETE FROM public.companies WHERE id = _company_id;
END;
$$;

-- (Opcional) Verifique se a policy de DELETE na tabela companies ainda está OK:
-- CREATE POLICY "Masters can delete companies"
--     ON public.companies
--     FOR DELETE
--     TO authenticated
--     USING (public.has_role(auth.uid(), 'master'));
