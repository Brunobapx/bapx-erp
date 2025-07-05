-- Remover sistema de filtro por usuário individual e implementar compartilhamento por empresa
-- Todas as policies serão baseadas apenas em company_id

-- Clientes - remover filtro por user_id
DROP POLICY IF EXISTS "Users can manage their own clients" ON public.clients;

CREATE POLICY "Users can view company clients" 
  ON public.clients 
  FOR SELECT 
  USING (company_id = 'default-company');

CREATE POLICY "Users can create company clients" 
  ON public.clients 
  FOR INSERT 
  WITH CHECK (company_id = 'default-company');

CREATE POLICY "Users can update company clients" 
  ON public.clients 
  FOR UPDATE 
  USING (company_id = 'default-company');

CREATE POLICY "Users can delete company clients" 
  ON public.clients 
  FOR DELETE 
  USING (company_id = 'default-company');

-- Produtos - remover filtro por user_id
DROP POLICY IF EXISTS "Users can manage their own products" ON public.products;

CREATE POLICY "Users can view company products" 
  ON public.products 
  FOR SELECT 
  USING (company_id = 'default-company');

CREATE POLICY "Users can create company products" 
  ON public.products 
  FOR INSERT 
  WITH CHECK (company_id = 'default-company');

CREATE POLICY "Users can update company products" 
  ON public.products 
  FOR UPDATE 
  USING (company_id = 'default-company');

CREATE POLICY "Users can delete company products" 
  ON public.products 
  FOR DELETE 
  USING (company_id = 'default-company');

-- Fornecedores - remover filtro por user_id
DROP POLICY IF EXISTS "Users can view company vendors" ON public.vendors;
DROP POLICY IF EXISTS "Users can create company vendors" ON public.vendors;
DROP POLICY IF EXISTS "Users can update company vendors" ON public.vendors;
DROP POLICY IF EXISTS "Users can delete company vendors" ON public.vendors;

CREATE POLICY "Users can view company vendors" 
  ON public.vendors 
  FOR SELECT 
  USING (company_id = 'default-company');

CREATE POLICY "Users can create company vendors" 
  ON public.vendors 
  FOR INSERT 
  WITH CHECK (company_id = 'default-company');

CREATE POLICY "Users can update company vendors" 
  ON public.vendors 
  FOR UPDATE 
  USING (company_id = 'default-company');

CREATE POLICY "Users can delete company vendors" 
  ON public.vendors 
  FOR DELETE 
  USING (company_id = 'default-company');

-- Pedidos - remover filtro por user_id
DROP POLICY IF EXISTS "Users can manage their own orders" ON public.orders;

CREATE POLICY "Users can view company orders" 
  ON public.orders 
  FOR SELECT 
  USING (company_id = 'default-company');

CREATE POLICY "Users can create company orders" 
  ON public.orders 
  FOR INSERT 
  WITH CHECK (company_id = 'default-company');

CREATE POLICY "Users can update company orders" 
  ON public.orders 
  FOR UPDATE 
  USING (company_id = 'default-company');

CREATE POLICY "Users can delete company orders" 
  ON public.orders 
  FOR DELETE 
  USING (company_id = 'default-company');

-- Itens de pedidos - remover filtro por user_id
DROP POLICY IF EXISTS "Users can manage their own order items" ON public.order_items;

CREATE POLICY "Users can view company order items" 
  ON public.order_items 
  FOR SELECT 
  USING (company_id = 'default-company');

CREATE POLICY "Users can create company order items" 
  ON public.order_items 
  FOR INSERT 
  WITH CHECK (company_id = 'default-company');

CREATE POLICY "Users can update company order items" 
  ON public.order_items 
  FOR UPDATE 
  USING (company_id = 'default-company');

CREATE POLICY "Users can delete company order items" 
  ON public.order_items 
  FOR DELETE 
  USING (company_id = 'default-company');

-- Lançamentos financeiros - remover filtro por user_id
DROP POLICY IF EXISTS "Users can manage their own financial entries" ON public.financial_entries;

CREATE POLICY "Users can view company financial entries" 
  ON public.financial_entries 
  FOR SELECT 
  USING (company_id = 'default-company');

CREATE POLICY "Users can create company financial entries" 
  ON public.financial_entries 
  FOR INSERT 
  WITH CHECK (company_id = 'default-company');

CREATE POLICY "Users can update company financial entries" 
  ON public.financial_entries 
  FOR UPDATE 
  USING (company_id = 'default-company');

CREATE POLICY "Users can delete company financial entries" 
  ON public.financial_entries 
  FOR DELETE 
  USING (company_id = 'default-company');

-- Vendas - remover filtro por user_id
DROP POLICY IF EXISTS "Users can manage their own sales" ON public.sales;

CREATE POLICY "Users can view company sales" 
  ON public.sales 
  FOR SELECT 
  USING (company_id = 'default-company');

CREATE POLICY "Users can create company sales" 
  ON public.sales 
  FOR INSERT 
  WITH CHECK (company_id = 'default-company');

CREATE POLICY "Users can update company sales" 
  ON public.sales 
  FOR UPDATE 
  USING (company_id = 'default-company');

CREATE POLICY "Users can delete company sales" 
  ON public.sales 
  FOR DELETE 
  USING (company_id = 'default-company');

-- Produção - remover filtro por user_id
DROP POLICY IF EXISTS "Users can manage their own production" ON public.production;

CREATE POLICY "Users can view company production" 
  ON public.production 
  FOR SELECT 
  USING (company_id = 'default-company');

CREATE POLICY "Users can create company production" 
  ON public.production 
  FOR INSERT 
  WITH CHECK (company_id = 'default-company');

CREATE POLICY "Users can update company production" 
  ON public.production 
  FOR UPDATE 
  USING (company_id = 'default-company');

CREATE POLICY "Users can delete company production" 
  ON public.production 
  FOR DELETE 
  USING (company_id = 'default-company');

-- Embalagem - remover filtro por user_id
DROP POLICY IF EXISTS "Users can manage their own packaging" ON public.packaging;

CREATE POLICY "Users can view company packaging" 
  ON public.packaging 
  FOR SELECT 
  USING (company_id = 'default-company');

CREATE POLICY "Users can create company packaging" 
  ON public.packaging 
  FOR INSERT 
  WITH CHECK (company_id = 'default-company');

CREATE POLICY "Users can update company packaging" 
  ON public.packaging 
  FOR UPDATE 
  USING (company_id = 'default-company');

CREATE POLICY "Users can delete company packaging" 
  ON public.packaging 
  FOR DELETE 
  USING (company_id = 'default-company');

-- Rotas de entrega - remover filtro por user_id
DROP POLICY IF EXISTS "Users can manage their own delivery routes" ON public.delivery_routes;

CREATE POLICY "Users can view company delivery routes" 
  ON public.delivery_routes 
  FOR SELECT 
  USING (company_id = 'default-company');

CREATE POLICY "Users can create company delivery routes" 
  ON public.delivery_routes 
  FOR INSERT 
  WITH CHECK (company_id = 'default-company');

CREATE POLICY "Users can update company delivery routes" 
  ON public.delivery_routes 
  FOR UPDATE 
  USING (company_id = 'default-company');

CREATE POLICY "Users can delete company delivery routes" 
  ON public.delivery_routes 
  FOR DELETE 
  USING (company_id = 'default-company');

-- Contas a pagar - remover filtro por user_id
DROP POLICY IF EXISTS "Users can view their own accounts payable" ON public.accounts_payable;
DROP POLICY IF EXISTS "Users can create their own accounts payable" ON public.accounts_payable;
DROP POLICY IF EXISTS "Users can update their own accounts payable" ON public.accounts_payable;
DROP POLICY IF EXISTS "Users can delete their own accounts payable" ON public.accounts_payable;

CREATE POLICY "Users can view company accounts payable" 
  ON public.accounts_payable 
  FOR SELECT 
  USING (company_id = 'default-company');

CREATE POLICY "Users can create company accounts payable" 
  ON public.accounts_payable 
  FOR INSERT 
  WITH CHECK (company_id = 'default-company');

CREATE POLICY "Users can update company accounts payable" 
  ON public.accounts_payable 
  FOR UPDATE 
  USING (company_id = 'default-company');

CREATE POLICY "Users can delete company accounts payable" 
  ON public.accounts_payable 
  FOR DELETE 
  USING (company_id = 'default-company');

-- Categorias de produtos - remover filtro por user_id
DROP POLICY IF EXISTS "Users can view their own categories" ON public.product_categories;
DROP POLICY IF EXISTS "Users can create their own categories" ON public.product_categories;
DROP POLICY IF EXISTS "Users can update their own categories" ON public.product_categories;
DROP POLICY IF EXISTS "Users can delete their own categories" ON public.product_categories;

CREATE POLICY "Users can view company categories" 
  ON public.product_categories 
  FOR SELECT 
  USING (company_id = 'default-company');

CREATE POLICY "Users can create company categories" 
  ON public.product_categories 
  FOR INSERT 
  WITH CHECK (company_id = 'default-company');

CREATE POLICY "Users can update company categories" 
  ON public.product_categories 
  FOR UPDATE 
  USING (company_id = 'default-company');

CREATE POLICY "Users can delete company categories" 
  ON public.product_categories 
  FOR DELETE 
  USING (company_id = 'default-company');

-- Receitas de produtos - remover filtro por user_id
DROP POLICY IF EXISTS "Users can manage their own product recipes" ON public.product_recipes;

CREATE POLICY "Users can view company product recipes" 
  ON public.product_recipes 
  FOR SELECT 
  USING (company_id = 'default-company');

CREATE POLICY "Users can create company product recipes" 
  ON public.product_recipes 
  FOR INSERT 
  WITH CHECK (company_id = 'default-company');

CREATE POLICY "Users can update company product recipes" 
  ON public.product_recipes 
  FOR UPDATE 
  USING (company_id = 'default-company');

CREATE POLICY "Users can delete company product recipes" 
  ON public.product_recipes 
  FOR DELETE 
  USING (company_id = 'default-company');

-- Ordens de serviço - remover filtro por user_id
DROP POLICY IF EXISTS "Usuários podem ler suas OS" ON public.service_orders;
DROP POLICY IF EXISTS "Usuários podem criar suas OS" ON public.service_orders;
DROP POLICY IF EXISTS "Usuários podem atualizar suas OS" ON public.service_orders;
DROP POLICY IF EXISTS "Usuários podem deletar suas OS" ON public.service_orders;

CREATE POLICY "Users can view company service orders" 
  ON public.service_orders 
  FOR SELECT 
  USING (company_id = 'default-company');

CREATE POLICY "Users can create company service orders" 
  ON public.service_orders 
  FOR INSERT 
  WITH CHECK (company_id = 'default-company');

CREATE POLICY "Users can update company service orders" 
  ON public.service_orders 
  FOR UPDATE 
  USING (company_id = 'default-company');

CREATE POLICY "Users can delete company service orders" 
  ON public.service_orders 
  FOR DELETE 
  USING (company_id = 'default-company');

-- Materiais de ordem de serviço - atualizar para usar company_id
DROP POLICY IF EXISTS "Usuários podem ver materiais da sua OS" ON public.service_order_materials;
DROP POLICY IF EXISTS "Usuários podem inserir materiais da sua OS" ON public.service_order_materials;

CREATE POLICY "Users can view company service order materials" 
  ON public.service_order_materials 
  FOR SELECT 
  USING (service_order_id IN ( 
    SELECT service_orders.id
    FROM service_orders
    WHERE service_orders.company_id = 'default-company'
  ));

CREATE POLICY "Users can create company service order materials" 
  ON public.service_order_materials 
  FOR INSERT 
  WITH CHECK (service_order_id IN ( 
    SELECT service_orders.id
    FROM service_orders
    WHERE service_orders.company_id = 'default-company'
  ));

-- Anexos de ordem de serviço - atualizar para usar company_id
DROP POLICY IF EXISTS "Usuários podem ver anexos da sua OS" ON public.service_order_attachments;
DROP POLICY IF EXISTS "Usuários podem inserir anexos na sua OS" ON public.service_order_attachments;

CREATE POLICY "Users can view company service order attachments" 
  ON public.service_order_attachments 
  FOR SELECT 
  USING (service_order_id IN ( 
    SELECT service_orders.id
    FROM service_orders
    WHERE service_orders.company_id = 'default-company'
  ));

CREATE POLICY "Users can create company service order attachments" 
  ON public.service_order_attachments 
  FOR INSERT 
  WITH CHECK (service_order_id IN ( 
    SELECT service_orders.id
    FROM service_orders
    WHERE service_orders.company_id = 'default-company'
  ));

-- Atribuições de rotas - remover filtro por user_id
DROP POLICY IF EXISTS "Users can view their own route assignments" ON public.route_assignments;
DROP POLICY IF EXISTS "Users can create their own route assignments" ON public.route_assignments;
DROP POLICY IF EXISTS "Users can update their own route assignments" ON public.route_assignments;
DROP POLICY IF EXISTS "Users can delete their own route assignments" ON public.route_assignments;

CREATE POLICY "Users can view company route assignments" 
  ON public.route_assignments 
  FOR SELECT 
  USING (company_id = 'default-company');

CREATE POLICY "Users can create company route assignments" 
  ON public.route_assignments 
  FOR INSERT 
  WITH CHECK (company_id = 'default-company');

CREATE POLICY "Users can update company route assignments" 
  ON public.route_assignments 
  FOR UPDATE 
  USING (company_id = 'default-company');

CREATE POLICY "Users can delete company route assignments" 
  ON public.route_assignments 
  FOR DELETE 
  USING (company_id = 'default-company');

-- Itens de rota - remover filtro por user_id
DROP POLICY IF EXISTS "Users can view their own route items" ON public.route_items;
DROP POLICY IF EXISTS "Users can create their own route items" ON public.route_items;
DROP POLICY IF EXISTS "Users can update their own route items" ON public.route_items;
DROP POLICY IF EXISTS "Users can delete their own route items" ON public.route_items;

CREATE POLICY "Users can view company route items" 
  ON public.route_items 
  FOR SELECT 
  USING (company_id = 'default-company');

CREATE POLICY "Users can create company route items" 
  ON public.route_items 
  FOR INSERT 
  WITH CHECK (company_id = 'default-company');

CREATE POLICY "Users can update company route items" 
  ON public.route_items 
  FOR UPDATE 
  USING (company_id = 'default-company');

CREATE POLICY "Users can delete company route items" 
  ON public.route_items 
  FOR DELETE 
  USING (company_id = 'default-company');

-- Compras - atualizar para usar company_id
CREATE POLICY "Users can view company purchases" 
  ON public.purchases 
  FOR SELECT 
  USING (company_id = 'default-company');

CREATE POLICY "Users can create company purchases" 
  ON public.purchases 
  FOR INSERT 
  WITH CHECK (company_id = 'default-company');

CREATE POLICY "Users can update company purchases" 
  ON public.purchases 
  FOR UPDATE 
  USING (company_id = 'default-company');

CREATE POLICY "Users can delete company purchases" 
  ON public.purchases 
  FOR DELETE 
  USING (company_id = 'default-company');

-- Itens de compra - remover filtro por user_id
DROP POLICY IF EXISTS "Users can view their own purchase items" ON public.purchase_items;
DROP POLICY IF EXISTS "Users can create their own purchase items" ON public.purchase_items;
DROP POLICY IF EXISTS "Users can update their own purchase items" ON public.purchase_items;
DROP POLICY IF EXISTS "Users can delete their own purchase items" ON public.purchase_items;

CREATE POLICY "Users can view company purchase items" 
  ON public.purchase_items 
  FOR SELECT 
  USING (company_id = 'default-company');

CREATE POLICY "Users can create company purchase items" 
  ON public.purchase_items 
  FOR INSERT 
  WITH CHECK (company_id = 'default-company');

CREATE POLICY "Users can update company purchase items" 
  ON public.purchase_items 
  FOR UPDATE 
  USING (company_id = 'default-company');

CREATE POLICY "Users can delete company purchase items" 
  ON public.purchase_items 
  FOR DELETE 
  USING (company_id = 'default-company');

-- Veículos - atualizar para usar company_id
CREATE POLICY "Users can view company vehicles" 
  ON public.vehicles 
  FOR SELECT 
  USING (company_id = 'default-company');

CREATE POLICY "Users can create company vehicles" 
  ON public.vehicles 
  FOR INSERT 
  WITH CHECK (company_id = 'default-company');

CREATE POLICY "Users can update company vehicles" 
  ON public.vehicles 
  FOR UPDATE 
  USING (company_id = 'default-company');

CREATE POLICY "Users can delete company vehicles" 
  ON public.vehicles 
  FOR DELETE 
  USING (company_id = 'default-company');