-- Migração para sistema de empresa única com setores/departamentos

-- 1. Criar enum para tipos de departamento
CREATE TYPE public.department_type AS ENUM (
  'financeiro',
  'vendas', 
  'producao',
  'compras',
  'estoque',
  'rh',
  'ti',
  'diretoria',
  'administrativo'
);

-- 2. Criar tabela de departamentos de usuários
CREATE TABLE public.user_departments (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  department department_type NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(user_id, department)
);

-- Habilitar RLS na tabela user_departments
ALTER TABLE public.user_departments ENABLE ROW LEVEL SECURITY;

-- Policy para user_departments - usuários podem ver seus próprios departamentos
CREATE POLICY "Users can view their own departments" 
  ON public.user_departments 
  FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own departments" 
  ON public.user_departments 
  FOR ALL 
  USING (auth.uid() = user_id);

-- 3. Remover company_id de todas as tabelas principais
ALTER TABLE public.clients DROP COLUMN IF EXISTS company_id;
ALTER TABLE public.products DROP COLUMN IF EXISTS company_id;
ALTER TABLE public.vendors DROP COLUMN IF EXISTS company_id;
ALTER TABLE public.orders DROP COLUMN IF EXISTS company_id;
ALTER TABLE public.order_items DROP COLUMN IF EXISTS company_id;
ALTER TABLE public.financial_entries DROP COLUMN IF EXISTS company_id;
ALTER TABLE public.sales DROP COLUMN IF EXISTS company_id;
ALTER TABLE public.production DROP COLUMN IF EXISTS company_id;
ALTER TABLE public.packaging DROP COLUMN IF EXISTS company_id;
ALTER TABLE public.delivery_routes DROP COLUMN IF EXISTS company_id;
ALTER TABLE public.accounts_payable DROP COLUMN IF EXISTS company_id;
ALTER TABLE public.product_categories DROP COLUMN IF EXISTS company_id;
ALTER TABLE public.product_recipes DROP COLUMN IF EXISTS company_id;
ALTER TABLE public.service_orders DROP COLUMN IF EXISTS company_id;
ALTER TABLE public.route_assignments DROP COLUMN IF EXISTS company_id;
ALTER TABLE public.route_items DROP COLUMN IF EXISTS company_id;
ALTER TABLE public.purchases DROP COLUMN IF EXISTS company_id;
ALTER TABLE public.purchase_items DROP COLUMN IF EXISTS company_id;
ALTER TABLE public.vehicles DROP COLUMN IF EXISTS company_id;
ALTER TABLE public.financial_accounts DROP COLUMN IF EXISTS company_id;
ALTER TABLE public.financial_categories DROP COLUMN IF EXISTS company_id;
ALTER TABLE public.payment_methods DROP COLUMN IF EXISTS company_id;
ALTER TABLE public.payment_terms DROP COLUMN IF EXISTS company_id;
ALTER TABLE public.markup_settings DROP COLUMN IF EXISTS company_id;

-- 4. Remover todas as policies baseadas em company_id e criar policies simples para gestão colaborativa

-- Clientes - todos podem ver e gerenciar (gestão colaborativa)
DROP POLICY IF EXISTS "Users can view company clients" ON public.clients;
DROP POLICY IF EXISTS "Users can create company clients" ON public.clients;
DROP POLICY IF EXISTS "Users can update company clients" ON public.clients;
DROP POLICY IF EXISTS "Users can delete company clients" ON public.clients;

CREATE POLICY "Authenticated users can manage clients" 
  ON public.clients 
  FOR ALL 
  TO authenticated
  USING (true)
  WITH CHECK (auth.uid() = user_id);

-- Produtos - todos podem ver e gerenciar
DROP POLICY IF EXISTS "Users can view company products" ON public.products;
DROP POLICY IF EXISTS "Users can create company products" ON public.products;
DROP POLICY IF EXISTS "Users can update company products" ON public.products;
DROP POLICY IF EXISTS "Users can delete company products" ON public.products;

CREATE POLICY "Authenticated users can manage products" 
  ON public.products 
  FOR ALL 
  TO authenticated
  USING (true)
  WITH CHECK (auth.uid() = user_id);

-- Fornecedores - todos podem ver e gerenciar
DROP POLICY IF EXISTS "Users can view company vendors" ON public.vendors;
DROP POLICY IF EXISTS "Users can create company vendors" ON public.vendors;
DROP POLICY IF EXISTS "Users can update company vendors" ON public.vendors;
DROP POLICY IF EXISTS "Users can delete company vendors" ON public.vendors;

CREATE POLICY "Authenticated users can manage vendors" 
  ON public.vendors 
  FOR ALL 
  TO authenticated
  USING (true)
  WITH CHECK (auth.uid() = user_id);

-- Pedidos - todos podem ver e gerenciar
DROP POLICY IF EXISTS "Users can view company orders" ON public.orders;
DROP POLICY IF EXISTS "Users can create company orders" ON public.orders;
DROP POLICY IF EXISTS "Users can update company orders" ON public.orders;
DROP POLICY IF EXISTS "Users can delete company orders" ON public.orders;

CREATE POLICY "Authenticated users can manage orders" 
  ON public.orders 
  FOR ALL 
  TO authenticated
  USING (true)
  WITH CHECK (auth.uid() = user_id);

-- Itens de pedidos - todos podem ver e gerenciar
DROP POLICY IF EXISTS "Users can view company order items" ON public.order_items;
DROP POLICY IF EXISTS "Users can create company order items" ON public.order_items;
DROP POLICY IF EXISTS "Users can update company order items" ON public.order_items;
DROP POLICY IF EXISTS "Users can delete company order items" ON public.order_items;

CREATE POLICY "Authenticated users can manage order items" 
  ON public.order_items 
  FOR ALL 
  TO authenticated
  USING (true)
  WITH CHECK (auth.uid() = user_id);

-- Lançamentos financeiros - todos podem ver e gerenciar
DROP POLICY IF EXISTS "Users can view company financial entries" ON public.financial_entries;
DROP POLICY IF EXISTS "Users can create company financial entries" ON public.financial_entries;
DROP POLICY IF EXISTS "Users can update company financial entries" ON public.financial_entries;
DROP POLICY IF EXISTS "Users can delete company financial entries" ON public.financial_entries;

CREATE POLICY "Authenticated users can manage financial entries" 
  ON public.financial_entries 
  FOR ALL 
  TO authenticated
  USING (true)
  WITH CHECK (auth.uid() = user_id);

-- Vendas - todos podem ver e gerenciar
DROP POLICY IF EXISTS "Users can view company sales" ON public.sales;
DROP POLICY IF EXISTS "Users can create company sales" ON public.sales;
DROP POLICY IF EXISTS "Users can update company sales" ON public.sales;
DROP POLICY IF EXISTS "Users can delete company sales" ON public.sales;

CREATE POLICY "Authenticated users can manage sales" 
  ON public.sales 
  FOR ALL 
  TO authenticated
  USING (true)
  WITH CHECK (auth.uid() = user_id);

-- Produção - todos podem ver e gerenciar
DROP POLICY IF EXISTS "Users can view company production" ON public.production;
DROP POLICY IF EXISTS "Users can create company production" ON public.production;
DROP POLICY IF EXISTS "Users can update company production" ON public.production;
DROP POLICY IF EXISTS "Users can delete company production" ON public.production;

CREATE POLICY "Authenticated users can manage production" 
  ON public.production 
  FOR ALL 
  TO authenticated
  USING (true)
  WITH CHECK (auth.uid() = user_id);

-- Embalagem - todos podem ver e gerenciar
DROP POLICY IF EXISTS "Users can view company packaging" ON public.packaging;
DROP POLICY IF EXISTS "Users can create company packaging" ON public.packaging;
DROP POLICY IF EXISTS "Users can update company packaging" ON public.packaging;
DROP POLICY IF EXISTS "Users can delete company packaging" ON public.packaging;

CREATE POLICY "Authenticated users can manage packaging" 
  ON public.packaging 
  FOR ALL 
  TO authenticated
  USING (true)
  WITH CHECK (auth.uid() = user_id);

-- Rotas de entrega - todos podem ver e gerenciar
DROP POLICY IF EXISTS "Users can view company delivery routes" ON public.delivery_routes;
DROP POLICY IF EXISTS "Users can create company delivery routes" ON public.delivery_routes;
DROP POLICY IF EXISTS "Users can update company delivery routes" ON public.delivery_routes;
DROP POLICY IF EXISTS "Users can delete company delivery routes" ON public.delivery_routes;

CREATE POLICY "Authenticated users can manage delivery routes" 
  ON public.delivery_routes 
  FOR ALL 
  TO authenticated
  USING (true)
  WITH CHECK (auth.uid() = user_id);

-- Contas a pagar - todos podem ver e gerenciar
DROP POLICY IF EXISTS "Users can view company accounts payable" ON public.accounts_payable;
DROP POLICY IF EXISTS "Users can create company accounts payable" ON public.accounts_payable;
DROP POLICY IF EXISTS "Users can update company accounts payable" ON public.accounts_payable;
DROP POLICY IF EXISTS "Users can delete company accounts payable" ON public.accounts_payable;

CREATE POLICY "Authenticated users can manage accounts payable" 
  ON public.accounts_payable 
  FOR ALL 
  TO authenticated
  USING (true)
  WITH CHECK (auth.uid() = user_id);

-- Categorias de produtos - todos podem ver e gerenciar
DROP POLICY IF EXISTS "Users can view company categories" ON public.product_categories;
DROP POLICY IF EXISTS "Users can create company categories" ON public.product_categories;
DROP POLICY IF EXISTS "Users can update company categories" ON public.product_categories;
DROP POLICY IF EXISTS "Users can delete company categories" ON public.product_categories;

CREATE POLICY "Authenticated users can manage categories" 
  ON public.product_categories 
  FOR ALL 
  TO authenticated
  USING (true)
  WITH CHECK (auth.uid() = user_id);

-- Receitas de produtos - todos podem ver e gerenciar
DROP POLICY IF EXISTS "Users can view company product recipes" ON public.product_recipes;
DROP POLICY IF EXISTS "Users can create company product recipes" ON public.product_recipes;
DROP POLICY IF EXISTS "Users can update company product recipes" ON public.product_recipes;
DROP POLICY IF EXISTS "Users can delete company product recipes" ON public.product_recipes;

CREATE POLICY "Authenticated users can manage recipes" 
  ON public.product_recipes 
  FOR ALL 
  TO authenticated
  USING (true)
  WITH CHECK (auth.uid() = user_id);

-- Ordens de serviço - todos podem ver e gerenciar
DROP POLICY IF EXISTS "Users can view company service orders" ON public.service_orders;
DROP POLICY IF EXISTS "Users can create company service orders" ON public.service_orders;
DROP POLICY IF EXISTS "Users can update company service orders" ON public.service_orders;
DROP POLICY IF EXISTS "Users can delete company service orders" ON public.service_orders;

CREATE POLICY "Authenticated users can manage service orders" 
  ON public.service_orders 
  FOR ALL 
  TO authenticated
  USING (true)
  WITH CHECK (auth.uid() = user_id);

-- Materiais de OS - atualizar para colaborativo
DROP POLICY IF EXISTS "Users can view company service order materials" ON public.service_order_materials;
DROP POLICY IF EXISTS "Users can create company service order materials" ON public.service_order_materials;

CREATE POLICY "Authenticated users can manage service order materials" 
  ON public.service_order_materials 
  FOR ALL 
  TO authenticated
  USING (true);

-- Anexos de OS - atualizar para colaborativo
DROP POLICY IF EXISTS "Users can view company service order attachments" ON public.service_order_attachments;
DROP POLICY IF EXISTS "Users can create company service order attachments" ON public.service_order_attachments;

CREATE POLICY "Authenticated users can manage service order attachments" 
  ON public.service_order_attachments 
  FOR ALL 
  TO authenticated
  USING (true);

-- Atribuições de rotas - todos podem ver e gerenciar
DROP POLICY IF EXISTS "Users can view company route assignments" ON public.route_assignments;
DROP POLICY IF EXISTS "Users can create company route assignments" ON public.route_assignments;
DROP POLICY IF EXISTS "Users can update company route assignments" ON public.route_assignments;
DROP POLICY IF EXISTS "Users can delete company route assignments" ON public.route_assignments;

CREATE POLICY "Authenticated users can manage route assignments" 
  ON public.route_assignments 
  FOR ALL 
  TO authenticated
  USING (true)
  WITH CHECK (auth.uid() = user_id);

-- Itens de rota - todos podem ver e gerenciar
DROP POLICY IF EXISTS "Users can view company route items" ON public.route_items;
DROP POLICY IF EXISTS "Users can create company route items" ON public.route_items;
DROP POLICY IF EXISTS "Users can update company route items" ON public.route_items;
DROP POLICY IF EXISTS "Users can delete company route items" ON public.route_items;

CREATE POLICY "Authenticated users can manage route items" 
  ON public.route_items 
  FOR ALL 
  TO authenticated
  USING (true)
  WITH CHECK (auth.uid() = user_id);

-- Compras - todos podem ver e gerenciar
DROP POLICY IF EXISTS "Users can view company purchases" ON public.purchases;
DROP POLICY IF EXISTS "Users can create company purchases" ON public.purchases;
DROP POLICY IF EXISTS "Users can update company purchases" ON public.purchases;
DROP POLICY IF EXISTS "Users can delete company purchases" ON public.purchases;

CREATE POLICY "Authenticated users can manage purchases" 
  ON public.purchases 
  FOR ALL 
  TO authenticated
  USING (true);

-- Itens de compra - todos podem ver e gerenciar
DROP POLICY IF EXISTS "Users can view company purchase items" ON public.purchase_items;
DROP POLICY IF EXISTS "Users can create company purchase items" ON public.purchase_items;
DROP POLICY IF EXISTS "Users can update company purchase items" ON public.purchase_items;
DROP POLICY IF EXISTS "Users can delete company purchase items" ON public.purchase_items;

CREATE POLICY "Authenticated users can manage purchase items" 
  ON public.purchase_items 
  FOR ALL 
  TO authenticated
  USING (true)
  WITH CHECK (auth.uid() = user_id);

-- Veículos - todos podem ver e gerenciar
DROP POLICY IF EXISTS "Users can view company vehicles" ON public.vehicles;
DROP POLICY IF EXISTS "Users can create company vehicles" ON public.vehicles;
DROP POLICY IF EXISTS "Users can update company vehicles" ON public.vehicles;
DROP POLICY IF EXISTS "Users can delete company vehicles" ON public.vehicles;

CREATE POLICY "Authenticated users can manage vehicles" 
  ON public.vehicles 
  FOR ALL 
  TO authenticated
  USING (true);

-- Contas financeiras - todos podem ver e gerenciar
CREATE POLICY "Authenticated users can manage financial accounts" 
  ON public.financial_accounts 
  FOR ALL 
  TO authenticated
  USING (true);

-- Categorias financeiras - todos podem ver e gerenciar
CREATE POLICY "Authenticated users can manage financial categories" 
  ON public.financial_categories 
  FOR ALL 
  TO authenticated
  USING (true);

-- Métodos de pagamento - todos podem ver e gerenciar
CREATE POLICY "Authenticated users can manage payment methods" 
  ON public.payment_methods 
  FOR ALL 
  TO authenticated
  USING (true);

-- Termos de pagamento - todos podem ver e gerenciar
CREATE POLICY "Authenticated users can manage payment terms" 
  ON public.payment_terms 
  FOR ALL 
  TO authenticated
  USING (true);

-- Configurações de markup - todos podem ver e gerenciar
CREATE POLICY "Authenticated users can manage markup settings" 
  ON public.markup_settings 
  FOR ALL 
  TO authenticated
  USING (true);

-- 5. Remover tabela companies (não precisamos mais)
DROP TABLE IF EXISTS public.companies CASCADE;