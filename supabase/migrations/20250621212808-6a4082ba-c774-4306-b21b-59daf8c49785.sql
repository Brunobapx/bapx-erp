
-- Remover todas as políticas existentes e recriar com base em company_id
-- Vamos fazer isso de forma mais segura, removendo políticas que possam existir

-- Clientes
DO $$ 
BEGIN
    DROP POLICY IF EXISTS "Users can view company clients" ON public.clients;
    DROP POLICY IF EXISTS "Users can create company clients" ON public.clients;
    DROP POLICY IF EXISTS "Users can update company clients" ON public.clients;
    DROP POLICY IF EXISTS "Users can delete company clients" ON public.clients;
    DROP POLICY IF EXISTS "Users can view their own clients" ON public.clients;
    DROP POLICY IF EXISTS "Users can create their own clients" ON public.clients;
    DROP POLICY IF EXISTS "Users can update their own clients" ON public.clients;
    DROP POLICY IF EXISTS "Users can delete their own clients" ON public.clients;
EXCEPTION
    WHEN OTHERS THEN NULL;
END $$;

CREATE POLICY "Users can view company clients" 
  ON public.clients 
  FOR SELECT 
  USING (company_id = get_current_user_company_id());

CREATE POLICY "Users can create company clients" 
  ON public.clients 
  FOR INSERT 
  WITH CHECK (company_id = get_current_user_company_id());

CREATE POLICY "Users can update company clients" 
  ON public.clients 
  FOR UPDATE 
  USING (company_id = get_current_user_company_id());

CREATE POLICY "Users can delete company clients" 
  ON public.clients 
  FOR DELETE 
  USING (company_id = get_current_user_company_id());

-- Produtos
DO $$ 
BEGIN
    DROP POLICY IF EXISTS "Users can view company products" ON public.products;
    DROP POLICY IF EXISTS "Users can create company products" ON public.products;
    DROP POLICY IF EXISTS "Users can update company products" ON public.products;
    DROP POLICY IF EXISTS "Users can delete company products" ON public.products;
    DROP POLICY IF EXISTS "Users can view their own products" ON public.products;
    DROP POLICY IF EXISTS "Users can create their own products" ON public.products;
    DROP POLICY IF EXISTS "Users can update their own products" ON public.products;
    DROP POLICY IF EXISTS "Users can delete their own products" ON public.products;
EXCEPTION
    WHEN OTHERS THEN NULL;
END $$;

CREATE POLICY "Users can view company products" 
  ON public.products 
  FOR SELECT 
  USING (company_id = get_current_user_company_id());

CREATE POLICY "Users can create company products" 
  ON public.products 
  FOR INSERT 
  WITH CHECK (company_id = get_current_user_company_id());

CREATE POLICY "Users can update company products" 
  ON public.products 
  FOR UPDATE 
  USING (company_id = get_current_user_company_id());

CREATE POLICY "Users can delete company products" 
  ON public.products 
  FOR DELETE 
  USING (company_id = get_current_user_company_id());

-- Fornecedores
DO $$ 
BEGIN
    DROP POLICY IF EXISTS "Users can view company vendors" ON public.vendors;
    DROP POLICY IF EXISTS "Users can create company vendors" ON public.vendors;
    DROP POLICY IF EXISTS "Users can update company vendors" ON public.vendors;
    DROP POLICY IF EXISTS "Users can delete company vendors" ON public.vendors;
    DROP POLICY IF EXISTS "Users can view their own vendors" ON public.vendors;
    DROP POLICY IF EXISTS "Users can create their own vendors" ON public.vendors;
    DROP POLICY IF EXISTS "Users can update their own vendors" ON public.vendors;
    DROP POLICY IF EXISTS "Users can delete their own vendors" ON public.vendors;
EXCEPTION
    WHEN OTHERS THEN NULL;
END $$;

CREATE POLICY "Users can view company vendors" 
  ON public.vendors 
  FOR SELECT 
  USING (company_id = get_current_user_company_id());

CREATE POLICY "Users can create company vendors" 
  ON public.vendors 
  FOR INSERT 
  WITH CHECK (company_id = get_current_user_company_id());

CREATE POLICY "Users can update company vendors" 
  ON public.vendors 
  FOR UPDATE 
  USING (company_id = get_current_user_company_id());

CREATE POLICY "Users can delete company vendors" 
  ON public.vendors 
  FOR DELETE 
  USING (company_id = get_current_user_company_id());

-- Pedidos
DO $$ 
BEGIN
    DROP POLICY IF EXISTS "Users can view company orders" ON public.orders;
    DROP POLICY IF EXISTS "Users can create company orders" ON public.orders;
    DROP POLICY IF EXISTS "Users can update company orders" ON public.orders;
    DROP POLICY IF EXISTS "Users can delete company orders" ON public.orders;
    DROP POLICY IF EXISTS "Users can view their own orders" ON public.orders;
    DROP POLICY IF EXISTS "Users can create their own orders" ON public.orders;
    DROP POLICY IF EXISTS "Users can update their own orders" ON public.orders;
    DROP POLICY IF EXISTS "Users can delete their own orders" ON public.orders;
EXCEPTION
    WHEN OTHERS THEN NULL;
END $$;

CREATE POLICY "Users can view company orders" 
  ON public.orders 
  FOR SELECT 
  USING (company_id = get_current_user_company_id());

CREATE POLICY "Users can create company orders" 
  ON public.orders 
  FOR INSERT 
  WITH CHECK (company_id = get_current_user_company_id());

CREATE POLICY "Users can update company orders" 
  ON public.orders 
  FOR UPDATE 
  USING (company_id = get_current_user_company_id());

CREATE POLICY "Users can delete company orders" 
  ON public.orders 
  FOR DELETE 
  USING (company_id = get_current_user_company_id());

-- Ordens de Serviço
DO $$ 
BEGIN
    DROP POLICY IF EXISTS "Users can view company service_orders" ON public.service_orders;
    DROP POLICY IF EXISTS "Users can create company service_orders" ON public.service_orders;
    DROP POLICY IF EXISTS "Users can update company service_orders" ON public.service_orders;
    DROP POLICY IF EXISTS "Users can delete company service_orders" ON public.service_orders;
    DROP POLICY IF EXISTS "Users can view their own service_orders" ON public.service_orders;
    DROP POLICY IF EXISTS "Users can create their own service_orders" ON public.service_orders;
    DROP POLICY IF EXISTS "Users can update their own service_orders" ON public.service_orders;
    DROP POLICY IF EXISTS "Users can delete their own service_orders" ON public.service_orders;
EXCEPTION
    WHEN OTHERS THEN NULL;
END $$;

CREATE POLICY "Users can view company service_orders" 
  ON public.service_orders 
  FOR SELECT 
  USING (company_id = get_current_user_company_id());

CREATE POLICY "Users can create company service_orders" 
  ON public.service_orders 
  FOR INSERT 
  WITH CHECK (company_id = get_current_user_company_id());

CREATE POLICY "Users can update company service_orders" 
  ON public.service_orders 
  FOR UPDATE 
  USING (company_id = get_current_user_company_id());

CREATE POLICY "Users can delete company service_orders" 
  ON public.service_orders 
  FOR DELETE 
  USING (company_id = get_current_user_company_id());

-- Financeiro
DO $$ 
BEGIN
    DROP POLICY IF EXISTS "Users can view company financial_entries" ON public.financial_entries;
    DROP POLICY IF EXISTS "Users can create company financial_entries" ON public.financial_entries;
    DROP POLICY IF EXISTS "Users can update company financial_entries" ON public.financial_entries;
    DROP POLICY IF EXISTS "Users can delete company financial_entries" ON public.financial_entries;
    DROP POLICY IF EXISTS "Users can view their own financial_entries" ON public.financial_entries;
    DROP POLICY IF EXISTS "Users can create their own financial_entries" ON public.financial_entries;
    DROP POLICY IF EXISTS "Users can update their own financial_entries" ON public.financial_entries;
    DROP POLICY IF EXISTS "Users can delete their own financial_entries" ON public.financial_entries;
EXCEPTION
    WHEN OTHERS THEN NULL;
END $$;

CREATE POLICY "Users can view company financial_entries" 
  ON public.financial_entries 
  FOR SELECT 
  USING (company_id = get_current_user_company_id());

CREATE POLICY "Users can create company financial_entries" 
  ON public.financial_entries 
  FOR INSERT 
  WITH CHECK (company_id = get_current_user_company_id());

CREATE POLICY "Users can update company financial_entries" 
  ON public.financial_entries 
  FOR UPDATE 
  USING (company_id = get_current_user_company_id());

CREATE POLICY "Users can delete company financial_entries" 
  ON public.financial_entries 
  FOR DELETE 
  USING (company_id = get_current_user_company_id());
