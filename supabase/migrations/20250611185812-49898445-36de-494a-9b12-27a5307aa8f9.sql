
-- Função para obter o company_id do usuário atual
CREATE OR REPLACE FUNCTION public.get_current_user_company_id()
RETURNS uuid
LANGUAGE sql
STABLE SECURITY DEFINER
AS $$
  SELECT company_id FROM public.profiles WHERE id = auth.uid() LIMIT 1;
$$;

-- Atualizar todas as tabelas para usar o company_id automaticamente quando não fornecido
ALTER TABLE public.orders ALTER COLUMN company_id SET DEFAULT public.get_current_user_company_id();
ALTER TABLE public.order_items ALTER COLUMN company_id SET DEFAULT public.get_current_user_company_id();
ALTER TABLE public.clients ALTER COLUMN company_id SET DEFAULT public.get_current_user_company_id();
ALTER TABLE public.products ALTER COLUMN company_id SET DEFAULT public.get_current_user_company_id();
ALTER TABLE public.vendors ALTER COLUMN company_id SET DEFAULT public.get_current_user_company_id();
ALTER TABLE public.purchases ALTER COLUMN company_id SET DEFAULT public.get_current_user_company_id();
ALTER TABLE public.purchase_items ALTER COLUMN company_id SET DEFAULT public.get_current_user_company_id();
ALTER TABLE public.production ALTER COLUMN company_id SET DEFAULT public.get_current_user_company_id();
ALTER TABLE public.packaging ALTER COLUMN company_id SET DEFAULT public.get_current_user_company_id();
ALTER TABLE public.sales ALTER COLUMN company_id SET DEFAULT public.get_current_user_company_id();
ALTER TABLE public.financial_entries ALTER COLUMN company_id SET DEFAULT public.get_current_user_company_id();
ALTER TABLE public.delivery_routes ALTER COLUMN company_id SET DEFAULT public.get_current_user_company_id();
ALTER TABLE public.vehicles ALTER COLUMN company_id SET DEFAULT public.get_current_user_company_id();
ALTER TABLE public.route_assignments ALTER COLUMN company_id SET DEFAULT public.get_current_user_company_id();
ALTER TABLE public.route_items ALTER COLUMN company_id SET DEFAULT public.get_current_user_company_id();
ALTER TABLE public.product_categories ALTER COLUMN company_id SET DEFAULT public.get_current_user_company_id();
ALTER TABLE public.product_recipes ALTER COLUMN company_id SET DEFAULT public.get_current_user_company_id();
ALTER TABLE public.accounts_payable ALTER COLUMN company_id SET DEFAULT public.get_current_user_company_id();
