-- Adicionar company_id em todas as tabelas que não têm
-- Tabelas que JÁ TÊM company_id: companies, financial_accounts, financial_categories, markup_settings, nota_configuracoes, payment_methods, payment_terms, sales, system_settings

-- 1. CLIENTS
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS company_id UUID;

-- 2. PRODUCTS  
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS company_id UUID;

-- 3. ORDERS
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS company_id UUID;

-- 4. ORDER_ITEMS
ALTER TABLE public.order_items ADD COLUMN IF NOT EXISTS company_id UUID;

-- 5. ORDER_ITEM_TRACKING
ALTER TABLE public.order_item_tracking ADD COLUMN IF NOT EXISTS company_id UUID;

-- 6. PRODUCTION
ALTER TABLE public.production ADD COLUMN IF NOT EXISTS company_id UUID;

-- 7. PACKAGING
-- Já tem company_id

-- 8. FINANCIAL_ENTRIES
ALTER TABLE public.financial_entries ADD COLUMN IF NOT EXISTS company_id UUID;

-- 9. ACCOUNTS_PAYABLE
ALTER TABLE public.accounts_payable ADD COLUMN IF NOT EXISTS company_id UUID;

-- 10. PURCHASES
ALTER TABLE public.purchases ADD COLUMN IF NOT EXISTS company_id UUID;

-- 11. PURCHASE_ITEMS
ALTER TABLE public.purchase_items ADD COLUMN IF NOT EXISTS company_id UUID;

-- 12. VENDORS
ALTER TABLE public.vendors ADD COLUMN IF NOT EXISTS company_id UUID;

-- 13. PRODUCT_CATEGORIES
ALTER TABLE public.product_categories ADD COLUMN IF NOT EXISTS company_id UUID;

-- 14. PRODUCT_RECIPES
ALTER TABLE public.product_recipes ADD COLUMN IF NOT EXISTS company_id UUID;

-- 15. DELIVERY_ROUTES
ALTER TABLE public.delivery_routes ADD COLUMN IF NOT EXISTS company_id UUID;

-- 16. ROUTE_ASSIGNMENTS
ALTER TABLE public.route_assignments ADD COLUMN IF NOT EXISTS company_id UUID;

-- 17. ROUTE_ITEMS
ALTER TABLE public.route_items ADD COLUMN IF NOT EXISTS company_id UUID;

-- 18. SERVICE_ORDERS
ALTER TABLE public.service_orders ADD COLUMN IF NOT EXISTS company_id UUID;

-- 19. SERVICE_ORDER_ATTACHMENTS
ALTER TABLE public.service_order_attachments ADD COLUMN IF NOT EXISTS company_id UUID;

-- 20. VEHICLES
ALTER TABLE public.vehicles ADD COLUMN IF NOT EXISTS company_id UUID;

-- 21. PERDAS
ALTER TABLE public.perdas ADD COLUMN IF NOT EXISTS company_id UUID;

-- 22. TROCAS
ALTER TABLE public.trocas ADD COLUMN IF NOT EXISTS company_id UUID;

-- 23. COMMISSION_PAYMENTS
ALTER TABLE public.commission_payments ADD COLUMN IF NOT EXISTS company_id UUID;

-- 24. SELLER_COMMISSIONS
ALTER TABLE public.seller_commissions ADD COLUMN IF NOT EXISTS company_id UUID;

-- 25. FISCAL_INVOICES
ALTER TABLE public.fiscal_invoices ADD COLUMN IF NOT EXISTS company_id UUID;

-- 26. NOTAS_EMITIDAS
ALTER TABLE public.notas_emitidas ADD COLUMN IF NOT EXISTS company_id UUID;

-- 27. NOTA_LOGS
ALTER TABLE public.nota_logs ADD COLUMN IF NOT EXISTS company_id UUID;

-- 28. EXTRATO_BANCARIO_IMPORTADO
ALTER TABLE public.extrato_bancario_importado ADD COLUMN IF NOT EXISTS company_id UUID;

-- 29. CONCILIACOES
ALTER TABLE public.conciliacoes ADD COLUMN IF NOT EXISTS company_id UUID;

-- 30. SECURITY_AUDIT_LOG
ALTER TABLE public.security_audit_log ADD COLUMN IF NOT EXISTS company_id UUID;

-- 31. BACKUP_HISTORY
ALTER TABLE public.backup_history ADD COLUMN IF NOT EXISTS company_id UUID;

-- 32. COMPANY_SEQUENCES
-- Já tem company_id

-- Atualizar dados existentes - associar à primeira empresa
DO $$
DECLARE
  first_company_id UUID;
BEGIN
  -- Pegar a primeira empresa
  SELECT id INTO first_company_id FROM public.companies LIMIT 1;
  
  IF first_company_id IS NOT NULL THEN
    -- Atualizar todas as tabelas com company_id NULL
    UPDATE public.clients SET company_id = first_company_id WHERE company_id IS NULL;
    UPDATE public.products SET company_id = first_company_id WHERE company_id IS NULL;
    UPDATE public.orders SET company_id = first_company_id WHERE company_id IS NULL;
    UPDATE public.order_items SET company_id = first_company_id WHERE company_id IS NULL;
    UPDATE public.order_item_tracking SET company_id = first_company_id WHERE company_id IS NULL;
    UPDATE public.production SET company_id = first_company_id WHERE company_id IS NULL;
    UPDATE public.packaging SET company_id = first_company_id WHERE company_id IS NULL;
    UPDATE public.financial_entries SET company_id = first_company_id WHERE company_id IS NULL;
    UPDATE public.accounts_payable SET company_id = first_company_id WHERE company_id IS NULL;
    UPDATE public.purchases SET company_id = first_company_id WHERE company_id IS NULL;
    UPDATE public.purchase_items SET company_id = first_company_id WHERE company_id IS NULL;
    UPDATE public.vendors SET company_id = first_company_id WHERE company_id IS NULL;
    UPDATE public.product_categories SET company_id = first_company_id WHERE company_id IS NULL;
    UPDATE public.product_recipes SET company_id = first_company_id WHERE company_id IS NULL;
    UPDATE public.delivery_routes SET company_id = first_company_id WHERE company_id IS NULL;
    UPDATE public.route_assignments SET company_id = first_company_id WHERE company_id IS NULL;
    UPDATE public.route_items SET company_id = first_company_id WHERE company_id IS NULL;
    UPDATE public.service_orders SET company_id = first_company_id WHERE company_id IS NULL;
    UPDATE public.service_order_attachments SET company_id = first_company_id WHERE company_id IS NULL;
    UPDATE public.vehicles SET company_id = first_company_id WHERE company_id IS NULL;
    UPDATE public.perdas SET company_id = first_company_id WHERE company_id IS NULL;
    UPDATE public.trocas SET company_id = first_company_id WHERE company_id IS NULL;
    UPDATE public.commission_payments SET company_id = first_company_id WHERE company_id IS NULL;
    UPDATE public.seller_commissions SET company_id = first_company_id WHERE company_id IS NULL;
    UPDATE public.fiscal_invoices SET company_id = first_company_id WHERE company_id IS NULL;
    UPDATE public.notas_emitidas SET company_id = first_company_id WHERE company_id IS NULL;
    UPDATE public.nota_logs SET company_id = first_company_id WHERE company_id IS NULL;
    UPDATE public.extrato_bancario_importado SET company_id = first_company_id WHERE company_id IS NULL;
    UPDATE public.conciliacoes SET company_id = first_company_id WHERE company_id IS NULL;
    UPDATE public.security_audit_log SET company_id = first_company_id WHERE company_id IS NULL;
    UPDATE public.backup_history SET company_id = first_company_id WHERE company_id IS NULL;
  END IF;
END $$;

-- Tornar company_id NOT NULL depois de popular
ALTER TABLE public.clients ALTER COLUMN company_id SET NOT NULL;
ALTER TABLE public.products ALTER COLUMN company_id SET NOT NULL;
ALTER TABLE public.orders ALTER COLUMN company_id SET NOT NULL;
ALTER TABLE public.order_items ALTER COLUMN company_id SET NOT NULL;
ALTER TABLE public.order_item_tracking ALTER COLUMN company_id SET NOT NULL;
ALTER TABLE public.production ALTER COLUMN company_id SET NOT NULL;
ALTER TABLE public.financial_entries ALTER COLUMN company_id SET NOT NULL;
ALTER TABLE public.accounts_payable ALTER COLUMN company_id SET NOT NULL;
ALTER TABLE public.purchases ALTER COLUMN company_id SET NOT NULL;
ALTER TABLE public.purchase_items ALTER COLUMN company_id SET NOT NULL;
ALTER TABLE public.vendors ALTER COLUMN company_id SET NOT NULL;
ALTER TABLE public.product_categories ALTER COLUMN company_id SET NOT NULL;
ALTER TABLE public.product_recipes ALTER COLUMN company_id SET NOT NULL;
ALTER TABLE public.delivery_routes ALTER COLUMN company_id SET NOT NULL;
ALTER TABLE public.route_assignments ALTER COLUMN company_id SET NOT NULL;
ALTER TABLE public.route_items ALTER COLUMN company_id SET NOT NULL;
ALTER TABLE public.service_orders ALTER COLUMN company_id SET NOT NULL;
ALTER TABLE public.service_order_attachments ALTER COLUMN company_id SET NOT NULL;
ALTER TABLE public.vehicles ALTER COLUMN company_id SET NOT NULL;
ALTER TABLE public.perdas ALTER COLUMN company_id SET NOT NULL;
ALTER TABLE public.trocas ALTER COLUMN company_id SET NOT NULL;
ALTER TABLE public.commission_payments ALTER COLUMN company_id SET NOT NULL;
ALTER TABLE public.seller_commissions ALTER COLUMN company_id SET NOT NULL;
ALTER TABLE public.fiscal_invoices ALTER COLUMN company_id SET NOT NULL;
ALTER TABLE public.notas_emitidas ALTER COLUMN company_id SET NOT NULL;
ALTER TABLE public.nota_logs ALTER COLUMN company_id SET NOT NULL;
ALTER TABLE public.extrato_bancario_importado ALTER COLUMN company_id SET NOT NULL;
ALTER TABLE public.conciliacoes ALTER COLUMN company_id SET NOT NULL;
ALTER TABLE public.security_audit_log ALTER COLUMN company_id SET NOT NULL;
ALTER TABLE public.backup_history ALTER COLUMN company_id SET NOT NULL;

-- Atualizar função set_company_id para usar company_id diretamente
CREATE OR REPLACE FUNCTION public.set_company_id()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.company_id IS NULL THEN
    NEW.company_id := public.current_user_company_id();
  END IF;
  RETURN NEW;
END;
$$;

-- Adicionar triggers para definir company_id automaticamente em tabelas que não têm
CREATE TRIGGER set_company_id_clients
  BEFORE INSERT ON public.clients
  FOR EACH ROW
  EXECUTE FUNCTION public.set_company_id();

CREATE TRIGGER set_company_id_products
  BEFORE INSERT ON public.products
  FOR EACH ROW
  EXECUTE FUNCTION public.set_company_id();

CREATE TRIGGER set_company_id_orders
  BEFORE INSERT ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.set_company_id();

CREATE TRIGGER set_company_id_order_items
  BEFORE INSERT ON public.order_items
  FOR EACH ROW
  EXECUTE FUNCTION public.set_company_id();

CREATE TRIGGER set_company_id_order_item_tracking
  BEFORE INSERT ON public.order_item_tracking
  FOR EACH ROW
  EXECUTE FUNCTION public.set_company_id();

CREATE TRIGGER set_company_id_production
  BEFORE INSERT ON public.production
  FOR EACH ROW
  EXECUTE FUNCTION public.set_company_id();

CREATE TRIGGER set_company_id_financial_entries
  BEFORE INSERT ON public.financial_entries
  FOR EACH ROW
  EXECUTE FUNCTION public.set_company_id();

CREATE TRIGGER set_company_id_accounts_payable
  BEFORE INSERT ON public.accounts_payable
  FOR EACH ROW
  EXECUTE FUNCTION public.set_company_id();

CREATE TRIGGER set_company_id_purchases
  BEFORE INSERT ON public.purchases
  FOR EACH ROW
  EXECUTE FUNCTION public.set_company_id();

CREATE TRIGGER set_company_id_purchase_items
  BEFORE INSERT ON public.purchase_items
  FOR EACH ROW
  EXECUTE FUNCTION public.set_company_id();

CREATE TRIGGER set_company_id_vendors
  BEFORE INSERT ON public.vendors
  FOR EACH ROW
  EXECUTE FUNCTION public.set_company_id();

CREATE TRIGGER set_company_id_product_categories
  BEFORE INSERT ON public.product_categories
  FOR EACH ROW
  EXECUTE FUNCTION public.set_company_id();

CREATE TRIGGER set_company_id_product_recipes
  BEFORE INSERT ON public.product_recipes
  FOR EACH ROW
  EXECUTE FUNCTION public.set_company_id();

CREATE TRIGGER set_company_id_delivery_routes
  BEFORE INSERT ON public.delivery_routes
  FOR EACH ROW
  EXECUTE FUNCTION public.set_company_id();

CREATE TRIGGER set_company_id_route_assignments
  BEFORE INSERT ON public.route_assignments
  FOR EACH ROW
  EXECUTE FUNCTION public.set_company_id();

CREATE TRIGGER set_company_id_route_items
  BEFORE INSERT ON public.route_items
  FOR EACH ROW
  EXECUTE FUNCTION public.set_company_id();

CREATE TRIGGER set_company_id_service_orders
  BEFORE INSERT ON public.service_orders
  FOR EACH ROW
  EXECUTE FUNCTION public.set_company_id();

CREATE TRIGGER set_company_id_service_order_attachments
  BEFORE INSERT ON public.service_order_attachments
  FOR EACH ROW
  EXECUTE FUNCTION public.set_company_id();

CREATE TRIGGER set_company_id_vehicles
  BEFORE INSERT ON public.vehicles
  FOR EACH ROW
  EXECUTE FUNCTION public.set_company_id();

CREATE TRIGGER set_company_id_perdas
  BEFORE INSERT ON public.perdas
  FOR EACH ROW
  EXECUTE FUNCTION public.set_company_id();

CREATE TRIGGER set_company_id_trocas
  BEFORE INSERT ON public.trocas
  FOR EACH ROW
  EXECUTE FUNCTION public.set_company_id();

CREATE TRIGGER set_company_id_commission_payments
  BEFORE INSERT ON public.commission_payments
  FOR EACH ROW
  EXECUTE FUNCTION public.set_company_id();

CREATE TRIGGER set_company_id_seller_commissions
  BEFORE INSERT ON public.seller_commissions
  FOR EACH ROW
  EXECUTE FUNCTION public.set_company_id();

CREATE TRIGGER set_company_id_fiscal_invoices
  BEFORE INSERT ON public.fiscal_invoices
  FOR EACH ROW
  EXECUTE FUNCTION public.set_company_id();

CREATE TRIGGER set_company_id_notas_emitidas
  BEFORE INSERT ON public.notas_emitidas
  FOR EACH ROW
  EXECUTE FUNCTION public.set_company_id();

CREATE TRIGGER set_company_id_nota_logs
  BEFORE INSERT ON public.nota_logs
  FOR EACH ROW
  EXECUTE FUNCTION public.set_company_id();

CREATE TRIGGER set_company_id_extrato_bancario_importado
  BEFORE INSERT ON public.extrato_bancario_importado
  FOR EACH ROW
  EXECUTE FUNCTION public.set_company_id();

CREATE TRIGGER set_company_id_conciliacoes
  BEFORE INSERT ON public.conciliacoes
  FOR EACH ROW
  EXECUTE FUNCTION public.set_company_id();

CREATE TRIGGER set_company_id_security_audit_log
  BEFORE INSERT ON public.security_audit_log
  FOR EACH ROW
  EXECUTE FUNCTION public.set_company_id();

CREATE TRIGGER set_company_id_backup_history
  BEFORE INSERT ON public.backup_history
  FOR EACH ROW
  EXECUTE FUNCTION public.set_company_id();

-- Remover políticas RLS antigas que usam validate_company_access
DROP POLICY IF EXISTS "Users can manage clients from their company" ON public.clients;
DROP POLICY IF EXISTS "Users can manage products from their company" ON public.products;
DROP POLICY IF EXISTS "orders_company_access" ON public.orders;
DROP POLICY IF EXISTS "order_items_company_access" ON public.order_items;
DROP POLICY IF EXISTS "order_item_tracking_company_access" ON public.order_item_tracking;
DROP POLICY IF EXISTS "production_company_access" ON public.production;
DROP POLICY IF EXISTS "packaging_company_access" ON public.packaging;
DROP POLICY IF EXISTS "financial_entries_company_access" ON public.financial_entries;
DROP POLICY IF EXISTS "accounts_payable_company_access" ON public.accounts_payable;
DROP POLICY IF EXISTS "purchases_company_access" ON public.purchases;
DROP POLICY IF EXISTS "purchase_items_company_access" ON public.purchase_items;
DROP POLICY IF EXISTS "vendors_company_access" ON public.vendors;
DROP POLICY IF EXISTS "product_categories_company_access" ON public.product_categories;
DROP POLICY IF EXISTS "product_recipes_company_access" ON public.product_recipes;
DROP POLICY IF EXISTS "delivery_routes_company_access" ON public.delivery_routes;
DROP POLICY IF EXISTS "route_assignments_company_access" ON public.route_assignments;
DROP POLICY IF EXISTS "route_items_company_access" ON public.route_items;
DROP POLICY IF EXISTS "service_orders_company_access" ON public.service_orders;
DROP POLICY IF EXISTS "service_order_attachments_company_access" ON public.service_order_attachments;
DROP POLICY IF EXISTS "vehicles_company_access" ON public.vehicles;
DROP POLICY IF EXISTS "perdas_company_access" ON public.perdas;
DROP POLICY IF EXISTS "trocas_company_access" ON public.trocas;
DROP POLICY IF EXISTS "commission_payments_company_access" ON public.commission_payments;
DROP POLICY IF EXISTS "seller_commissions_company_access" ON public.seller_commissions;
DROP POLICY IF EXISTS "fiscal_invoices_company_access" ON public.fiscal_invoices;
DROP POLICY IF EXISTS "notas_emitidas_company_access" ON public.notas_emitidas;
DROP POLICY IF EXISTS "nota_logs_company_access" ON public.nota_logs;

-- Criar políticas RLS padronizadas usando company_id diretamente
CREATE POLICY "Company isolation" ON public.clients FOR ALL USING (company_id = current_user_company_id()) WITH CHECK (company_id = current_user_company_id());
CREATE POLICY "Company isolation" ON public.products FOR ALL USING (company_id = current_user_company_id()) WITH CHECK (company_id = current_user_company_id());
CREATE POLICY "Company isolation" ON public.orders FOR ALL USING (company_id = current_user_company_id()) WITH CHECK (company_id = current_user_company_id());
CREATE POLICY "Company isolation" ON public.order_items FOR ALL USING (company_id = current_user_company_id()) WITH CHECK (company_id = current_user_company_id());
CREATE POLICY "Company isolation" ON public.order_item_tracking FOR ALL USING (company_id = current_user_company_id()) WITH CHECK (company_id = current_user_company_id());
CREATE POLICY "Company isolation" ON public.production FOR ALL USING (company_id = current_user_company_id()) WITH CHECK (company_id = current_user_company_id());
CREATE POLICY "Company isolation" ON public.packaging FOR ALL USING (company_id = current_user_company_id()) WITH CHECK (company_id = current_user_company_id());
CREATE POLICY "Company isolation" ON public.financial_entries FOR ALL USING (company_id = current_user_company_id()) WITH CHECK (company_id = current_user_company_id());
CREATE POLICY "Company isolation" ON public.accounts_payable FOR ALL USING (company_id = current_user_company_id()) WITH CHECK (company_id = current_user_company_id());
CREATE POLICY "Company isolation" ON public.purchases FOR ALL USING (company_id = current_user_company_id()) WITH CHECK (company_id = current_user_company_id());
CREATE POLICY "Company isolation" ON public.purchase_items FOR ALL USING (company_id = current_user_company_id()) WITH CHECK (company_id = current_user_company_id());
CREATE POLICY "Company isolation" ON public.vendors FOR ALL USING (company_id = current_user_company_id()) WITH CHECK (company_id = current_user_company_id());
CREATE POLICY "Company isolation" ON public.product_categories FOR ALL USING (company_id = current_user_company_id()) WITH CHECK (company_id = current_user_company_id());
CREATE POLICY "Company isolation" ON public.product_recipes FOR ALL USING (company_id = current_user_company_id()) WITH CHECK (company_id = current_user_company_id());
CREATE POLICY "Company isolation" ON public.delivery_routes FOR ALL USING (company_id = current_user_company_id()) WITH CHECK (company_id = current_user_company_id());
CREATE POLICY "Company isolation" ON public.route_assignments FOR ALL USING (company_id = current_user_company_id()) WITH CHECK (company_id = current_user_company_id());
CREATE POLICY "Company isolation" ON public.route_items FOR ALL USING (company_id = current_user_company_id()) WITH CHECK (company_id = current_user_company_id());
CREATE POLICY "Company isolation" ON public.service_orders FOR ALL USING (company_id = current_user_company_id()) WITH CHECK (company_id = current_user_company_id());
CREATE POLICY "Company isolation" ON public.service_order_attachments FOR ALL USING (company_id = current_user_company_id()) WITH CHECK (company_id = current_user_company_id());
CREATE POLICY "Company isolation" ON public.vehicles FOR ALL USING (company_id = current_user_company_id()) WITH CHECK (company_id = current_user_company_id());
CREATE POLICY "Company isolation" ON public.perdas FOR ALL USING (company_id = current_user_company_id()) WITH CHECK (company_id = current_user_company_id());
CREATE POLICY "Company isolation" ON public.trocas FOR ALL USING (company_id = current_user_company_id()) WITH CHECK (company_id = current_user_company_id());
CREATE POLICY "Company isolation" ON public.commission_payments FOR ALL USING (company_id = current_user_company_id()) WITH CHECK (company_id = current_user_company_id());
CREATE POLICY "Company isolation" ON public.seller_commissions FOR ALL USING (company_id = current_user_company_id()) WITH CHECK (company_id = current_user_company_id());
CREATE POLICY "Company isolation" ON public.fiscal_invoices FOR ALL USING (company_id = current_user_company_id()) WITH CHECK (company_id = current_user_company_id());
CREATE POLICY "Company isolation" ON public.notas_emitidas FOR ALL USING (company_id = current_user_company_id()) WITH CHECK (company_id = current_user_company_id());
CREATE POLICY "Company isolation" ON public.nota_logs FOR ALL USING (company_id = current_user_company_id()) WITH CHECK (company_id = current_user_company_id());
CREATE POLICY "Company isolation" ON public.extrato_bancario_importado FOR ALL USING (company_id = current_user_company_id()) WITH CHECK (company_id = current_user_company_id());
CREATE POLICY "Company isolation" ON public.conciliacoes FOR ALL USING (company_id = current_user_company_id()) WITH CHECK (company_id = current_user_company_id());
CREATE POLICY "Company isolation" ON public.security_audit_log FOR ALL USING (company_id = current_user_company_id()) WITH CHECK (company_id = current_user_company_id());
CREATE POLICY "Company isolation" ON public.backup_history FOR ALL USING (company_id = current_user_company_id()) WITH CHECK (company_id = current_user_company_id());

-- Remover política redundante de perdas
DROP POLICY IF EXISTS "Authenticated users can manage all perdas" ON public.perdas;

-- Atualizar política de vendas para usar company_id diretamente
DROP POLICY IF EXISTS "sales_company_isolation_select" ON public.sales;
DROP POLICY IF EXISTS "sales_company_isolation_insert" ON public.sales;
DROP POLICY IF EXISTS "sales_company_isolation_update" ON public.sales;
DROP POLICY IF EXISTS "sales_company_isolation_delete" ON public.sales;

CREATE POLICY "Company isolation with seller restrictions" 
ON public.sales FOR ALL 
USING (
  company_id = current_user_company_id() AND 
  ((NOT is_seller(auth.uid())) OR (is_seller(auth.uid()) AND (user_id = auth.uid())))
)
WITH CHECK (
  company_id = current_user_company_id() AND 
  ((NOT is_seller(auth.uid())) OR (is_seller(auth.uid()) AND (user_id = auth.uid())))
);

-- Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_clients_company_id ON public.clients(company_id);
CREATE INDEX IF NOT EXISTS idx_products_company_id ON public.products(company_id);
CREATE INDEX IF NOT EXISTS idx_orders_company_id ON public.orders(company_id);
CREATE INDEX IF NOT EXISTS idx_order_items_company_id ON public.order_items(company_id);
CREATE INDEX IF NOT EXISTS idx_production_company_id ON public.production(company_id);
CREATE INDEX IF NOT EXISTS idx_packaging_company_id ON public.packaging(company_id);
CREATE INDEX IF NOT EXISTS idx_financial_entries_company_id ON public.financial_entries(company_id);
CREATE INDEX IF NOT EXISTS idx_accounts_payable_company_id ON public.accounts_payable(company_id);
CREATE INDEX IF NOT EXISTS idx_purchases_company_id ON public.purchases(company_id);
CREATE INDEX IF NOT EXISTS idx_vendors_company_id ON public.vendors(company_id);
CREATE INDEX IF NOT EXISTS idx_sales_company_id ON public.sales(company_id);