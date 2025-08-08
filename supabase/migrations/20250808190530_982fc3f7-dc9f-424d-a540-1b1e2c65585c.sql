-- Isolamento por empresa (RLS) em tabelas principais
-- Contém apenas políticas e habilitação de RLS quando aplicável

-- 1) accounts_payable
ALTER TABLE public.accounts_payable ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Authenticated users can manage all accounts payable" ON public.accounts_payable;
CREATE POLICY "accounts_payable_company_access"
ON public.accounts_payable
FOR ALL
USING (public.validate_company_access(user_id))
WITH CHECK (public.validate_company_access(user_id));

-- 2) commission_payments
ALTER TABLE public.commission_payments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Authenticated users can manage commission payments" ON public.commission_payments;
CREATE POLICY "commission_payments_company_access"
ON public.commission_payments
FOR ALL
USING (public.validate_company_access(user_id))
WITH CHECK (public.validate_company_access(user_id));

-- 3) delivery_routes
ALTER TABLE public.delivery_routes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Authenticated users can manage all delivery routes" ON public.delivery_routes;
CREATE POLICY "delivery_routes_company_access"
ON public.delivery_routes
FOR ALL
USING (public.validate_company_access(user_id))
WITH CHECK (public.validate_company_access(user_id));

-- 4) financial_entries (remover política permissiva)
ALTER TABLE public.financial_entries ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Authenticated users can manage all financial entries" ON public.financial_entries;
-- Mantém: financial_entries_company_access

-- 5) fiscal_invoices (remover política permissiva)
ALTER TABLE public.fiscal_invoices ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Authenticated users can manage all fiscal invoices" ON public.fiscal_invoices;
-- Mantém: fiscal_invoices_company_access

-- 6) notas_emitidas (remover política permissiva)
ALTER TABLE public.notas_emitidas ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Authenticated users can manage all notas emitidas" ON public.notas_emitidas;
-- Mantém: notas_emitidas_company_access

-- 7) order_item_tracking
ALTER TABLE public.order_item_tracking ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Authenticated users can manage order item tracking" ON public.order_item_tracking;
CREATE POLICY "order_item_tracking_company_access"
ON public.order_item_tracking
FOR ALL
USING (public.validate_company_access(user_id))
WITH CHECK (public.validate_company_access(user_id));

-- 8) order_items
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "order_items_authenticated_access" ON public.order_items;
CREATE POLICY "order_items_company_access"
ON public.order_items
FOR ALL
USING (public.validate_company_access(user_id))
WITH CHECK (public.validate_company_access(user_id));

-- 9) orders
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "orders_authenticated_access" ON public.orders;
CREATE POLICY "orders_company_access"
ON public.orders
FOR ALL
USING (public.validate_company_access(user_id))
WITH CHECK (public.validate_company_access(user_id));

-- 10) packaging (remover política permissiva)
ALTER TABLE public.packaging ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Authenticated users can manage all packaging" ON public.packaging;
-- Mantém: packaging_company_access

-- 11) product_categories (remover política permissiva)
ALTER TABLE public.product_categories ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Authenticated users can manage all categories" ON public.product_categories;
-- Mantém: product_categories_company_access

-- 12) product_recipes (remover política permissiva)
ALTER TABLE public.product_recipes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Authenticated users can manage all recipes" ON public.product_recipes;
-- Mantém: product_recipes_company_access

-- 13) production (remover política permissiva)
ALTER TABLE public.production ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Authenticated users can manage all production" ON public.production;
-- Mantém: production_company_access

-- 14) purchases (remover política permissiva)
ALTER TABLE public.purchases ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Authenticated users can manage all purchases" ON public.purchases;
-- Mantém: purchases_company_access

-- 15) purchase_items (remover política permissiva)
ALTER TABLE public.purchase_items ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Authenticated users can manage all purchase items" ON public.purchase_items;
-- Mantém: purchase_items_company_access

-- 16) route_assignments (remover política permissiva)
ALTER TABLE public.route_assignments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Authenticated users can manage all route assignments" ON public.route_assignments;
-- Mantém: route_assignments_company_access

-- 17) route_items (remover política permissiva)
ALTER TABLE public.route_items ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Authenticated users can manage all route items" ON public.route_items;
-- Mantém: route_items_company_access

-- 18) seller_commissions
ALTER TABLE public.seller_commissions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Authenticated users can manage seller commissions" ON public.seller_commissions;
CREATE POLICY "seller_commissions_company_access"
ON public.seller_commissions
FOR ALL
USING (public.validate_company_access(user_id))
WITH CHECK (public.validate_company_access(user_id));

-- 19) sales: reforçar isolamento por empresa mantendo lógica de vendedor
ALTER TABLE public.sales ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Sellers can only view their own sales" ON public.sales;
DROP POLICY IF EXISTS "Sellers can only update their own sales" ON public.sales;
DROP POLICY IF EXISTS "Sellers can only delete their own sales" ON public.sales;
DROP POLICY IF EXISTS "Sellers can only manage their own sales" ON public.sales;

-- SELECT
CREATE POLICY "sales_company_isolation_select"
ON public.sales
FOR SELECT
USING (
  public.validate_company_access(user_id)
  AND ((NOT public.is_seller(auth.uid())) OR (public.is_seller(auth.uid()) AND user_id = auth.uid()))
);

-- INSERT
CREATE POLICY "sales_company_isolation_insert"
ON public.sales
FOR INSERT
WITH CHECK (
  public.validate_company_access(user_id)
  AND ((NOT public.is_seller(auth.uid())) OR (public.is_seller(auth.uid()) AND user_id = auth.uid()))
);

-- UPDATE
CREATE POLICY "sales_company_isolation_update"
ON public.sales
FOR UPDATE
USING (
  public.validate_company_access(user_id)
  AND ((NOT public.is_seller(auth.uid())) OR (public.is_seller(auth.uid()) AND user_id = auth.uid()))
)
WITH CHECK (
  public.validate_company_access(user_id)
  AND ((NOT public.is_seller(auth.uid())) OR (public.is_seller(auth.uid()) AND user_id = auth.uid()))
);

-- DELETE
CREATE POLICY "sales_company_isolation_delete"
ON public.sales
FOR DELETE
USING (
  public.validate_company_access(user_id)
  AND ((NOT public.is_seller(auth.uid())) OR (public.is_seller(auth.uid()) AND user_id = auth.uid()))
);
