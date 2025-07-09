-- Atualizar políticas RLS para sistema colaborativo
-- Remover restrições por user_id e permitir acesso colaborativo

-- PRODUCTION
DROP POLICY IF EXISTS "Users can manage their own production" ON public.production;
DROP POLICY IF EXISTS "Authenticated users can manage production" ON public.production;

CREATE POLICY "Authenticated users can manage all production" 
ON public.production 
FOR ALL 
USING (auth.uid() IS NOT NULL)
WITH CHECK (auth.uid() IS NOT NULL);

-- PACKAGING  
DROP POLICY IF EXISTS "Users can manage their own packaging" ON public.packaging;
DROP POLICY IF EXISTS "Authenticated users can manage packaging" ON public.packaging;

CREATE POLICY "Authenticated users can manage all packaging" 
ON public.packaging 
FOR ALL 
USING (auth.uid() IS NOT NULL)
WITH CHECK (auth.uid() IS NOT NULL);

-- ORDERS
DROP POLICY IF EXISTS "Users can manage their own orders" ON public.orders;
DROP POLICY IF EXISTS "Authenticated users can manage orders" ON public.orders;

CREATE POLICY "Authenticated users can manage all orders" 
ON public.orders 
FOR ALL 
USING (auth.uid() IS NOT NULL)
WITH CHECK (auth.uid() IS NOT NULL);

-- ORDER ITEMS
DROP POLICY IF EXISTS "Users can manage their own order items" ON public.order_items;
DROP POLICY IF EXISTS "Authenticated users can manage order items" ON public.order_items;

CREATE POLICY "Authenticated users can manage all order items" 
ON public.order_items 
FOR ALL 
USING (auth.uid() IS NOT NULL)
WITH CHECK (auth.uid() IS NOT NULL);

-- CLIENTS
DROP POLICY IF EXISTS "Users can manage their own clients" ON public.clients;
DROP POLICY IF EXISTS "Authenticated users can manage clients" ON public.clients;

CREATE POLICY "Authenticated users can manage all clients" 
ON public.clients 
FOR ALL 
USING (auth.uid() IS NOT NULL)
WITH CHECK (auth.uid() IS NOT NULL);

-- PRODUCTS
DROP POLICY IF EXISTS "Users can manage their own products" ON public.products;
DROP POLICY IF EXISTS "Authenticated users can manage products" ON public.products;

CREATE POLICY "Authenticated users can manage all products" 
ON public.products 
FOR ALL 
USING (auth.uid() IS NOT NULL)
WITH CHECK (auth.uid() IS NOT NULL);

-- PRODUCT CATEGORIES
DROP POLICY IF EXISTS "Users can create their own categories" ON public.product_categories;
DROP POLICY IF EXISTS "Users can delete their own categories" ON public.product_categories;
DROP POLICY IF EXISTS "Users can update their own categories" ON public.product_categories;
DROP POLICY IF EXISTS "Users can view their own categories" ON public.product_categories;
DROP POLICY IF EXISTS "Authenticated users can manage categories" ON public.product_categories;

CREATE POLICY "Authenticated users can manage all categories" 
ON public.product_categories 
FOR ALL 
USING (auth.uid() IS NOT NULL)
WITH CHECK (auth.uid() IS NOT NULL);

-- PRODUCT RECIPES
DROP POLICY IF EXISTS "Users can manage their own product recipes" ON public.product_recipes;
DROP POLICY IF EXISTS "Authenticated users can manage recipes" ON public.product_recipes;

CREATE POLICY "Authenticated users can manage all recipes" 
ON public.product_recipes 
FOR ALL 
USING (auth.uid() IS NOT NULL)
WITH CHECK (auth.uid() IS NOT NULL);

-- SALES
DROP POLICY IF EXISTS "Users can manage their own sales" ON public.sales;
DROP POLICY IF EXISTS "Authenticated users can manage sales" ON public.sales;

CREATE POLICY "Authenticated users can manage all sales" 
ON public.sales 
FOR ALL 
USING (auth.uid() IS NOT NULL)
WITH CHECK (auth.uid() IS NOT NULL);

-- FINANCIAL ENTRIES
DROP POLICY IF EXISTS "Users can manage their own financial entries" ON public.financial_entries;
DROP POLICY IF EXISTS "Authenticated users can manage financial entries" ON public.financial_entries;

CREATE POLICY "Authenticated users can manage all financial entries" 
ON public.financial_entries 
FOR ALL 
USING (auth.uid() IS NOT NULL)
WITH CHECK (auth.uid() IS NOT NULL);

-- ACCOUNTS PAYABLE
DROP POLICY IF EXISTS "Users can create their own accounts payable" ON public.accounts_payable;
DROP POLICY IF EXISTS "Users can delete their own accounts payable" ON public.accounts_payable;
DROP POLICY IF EXISTS "Users can update their own accounts payable" ON public.accounts_payable;
DROP POLICY IF EXISTS "Users can view their own accounts payable" ON public.accounts_payable;
DROP POLICY IF EXISTS "Authenticated users can manage accounts payable" ON public.accounts_payable;

CREATE POLICY "Authenticated users can manage all accounts payable" 
ON public.accounts_payable 
FOR ALL 
USING (auth.uid() IS NOT NULL)
WITH CHECK (auth.uid() IS NOT NULL);

-- PURCHASES
DROP POLICY IF EXISTS "Authenticated users can manage purchases" ON public.purchases;

CREATE POLICY "Authenticated users can manage all purchases" 
ON public.purchases 
FOR ALL 
USING (auth.uid() IS NOT NULL)
WITH CHECK (auth.uid() IS NOT NULL);

-- PURCHASE ITEMS
DROP POLICY IF EXISTS "Users can create their own purchase items" ON public.purchase_items;
DROP POLICY IF EXISTS "Users can delete their own purchase items" ON public.purchase_items;
DROP POLICY IF EXISTS "Users can update their own purchase items" ON public.purchase_items;
DROP POLICY IF EXISTS "Users can view their own purchase items" ON public.purchase_items;
DROP POLICY IF EXISTS "Authenticated users can manage purchase items" ON public.purchase_items;

CREATE POLICY "Authenticated users can manage all purchase items" 
ON public.purchase_items 
FOR ALL 
USING (auth.uid() IS NOT NULL)
WITH CHECK (auth.uid() IS NOT NULL);

-- DELIVERY ROUTES
DROP POLICY IF EXISTS "Users can manage their own delivery routes" ON public.delivery_routes;
DROP POLICY IF EXISTS "Authenticated users can manage delivery routes" ON public.delivery_routes;

CREATE POLICY "Authenticated users can manage all delivery routes" 
ON public.delivery_routes 
FOR ALL 
USING (auth.uid() IS NOT NULL)
WITH CHECK (auth.uid() IS NOT NULL);

-- ROUTE ASSIGNMENTS
DROP POLICY IF EXISTS "Users can create their own route assignments" ON public.route_assignments;
DROP POLICY IF EXISTS "Users can delete their own route assignments" ON public.route_assignments;
DROP POLICY IF EXISTS "Users can update their own route assignments" ON public.route_assignments;
DROP POLICY IF EXISTS "Users can view their own route assignments" ON public.route_assignments;
DROP POLICY IF EXISTS "Authenticated users can manage route assignments" ON public.route_assignments;

CREATE POLICY "Authenticated users can manage all route assignments" 
ON public.route_assignments 
FOR ALL 
USING (auth.uid() IS NOT NULL)
WITH CHECK (auth.uid() IS NOT NULL);

-- ROUTE ITEMS
DROP POLICY IF EXISTS "Users can create their own route items" ON public.route_items;
DROP POLICY IF EXISTS "Users can delete their own route items" ON public.route_items;
DROP POLICY IF EXISTS "Users can update their own route items" ON public.route_items;
DROP POLICY IF EXISTS "Users can view their own route items" ON public.route_items;
DROP POLICY IF EXISTS "Authenticated users can manage route items" ON public.route_items;

CREATE POLICY "Authenticated users can manage all route items" 
ON public.route_items 
FOR ALL 
USING (auth.uid() IS NOT NULL)
WITH CHECK (auth.uid() IS NOT NULL);

-- VENDORS
DROP POLICY IF EXISTS "Authenticated users can manage vendors" ON public.vendors;

CREATE POLICY "Authenticated users can manage all vendors" 
ON public.vendors 
FOR ALL 
USING (auth.uid() IS NOT NULL)
WITH CHECK (auth.uid() IS NOT NULL);

-- SERVICE ORDERS
DROP POLICY IF EXISTS "Usuários podem atualizar suas OS" ON public.service_orders;
DROP POLICY IF EXISTS "Usuários podem criar suas OS" ON public.service_orders;
DROP POLICY IF EXISTS "Usuários podem deletar suas OS" ON public.service_orders;
DROP POLICY IF EXISTS "Usuários podem ler suas OS" ON public.service_orders;
DROP POLICY IF EXISTS "Authenticated users can manage service orders" ON public.service_orders;

CREATE POLICY "Authenticated users can manage all service orders" 
ON public.service_orders 
FOR ALL 
USING (auth.uid() IS NOT NULL)
WITH CHECK (auth.uid() IS NOT NULL);

-- SERVICE ORDER MATERIALS
DROP POLICY IF EXISTS "Usuários podem inserir materiais da sua OS" ON public.service_order_materials;
DROP POLICY IF EXISTS "Usuários podem ver materiais da sua OS" ON public.service_order_materials;
DROP POLICY IF EXISTS "Authenticated users can manage service order materials" ON public.service_order_materials;

CREATE POLICY "Authenticated users can manage all service order materials" 
ON public.service_order_materials 
FOR ALL 
USING (auth.uid() IS NOT NULL)
WITH CHECK (auth.uid() IS NOT NULL);

-- SERVICE ORDER ATTACHMENTS
DROP POLICY IF EXISTS "Usuários podem inserir anexos na sua OS" ON public.service_order_attachments;
DROP POLICY IF EXISTS "Usuários podem ver anexos da sua OS" ON public.service_order_attachments;
DROP POLICY IF EXISTS "Authenticated users can manage service order attachments" ON public.service_order_attachments;

CREATE POLICY "Authenticated users can manage all service order attachments" 
ON public.service_order_attachments 
FOR ALL 
USING (auth.uid() IS NOT NULL)
WITH CHECK (auth.uid() IS NOT NULL);