-- Fix RLS policies to use validate_company_access for company-wide sharing
-- but restrict sellers for orders and sales

-- Drop existing orders policy and create new conditional policy
DROP POLICY IF EXISTS "orders_policy" ON public.orders;
CREATE POLICY "orders_conditional_access" ON public.orders
FOR ALL
TO authenticated
USING (
  CASE 
    WHEN is_seller(auth.uid()) THEN (user_id = auth.uid())
    ELSE validate_company_access(user_id)
  END
)
WITH CHECK (
  CASE 
    WHEN is_seller(auth.uid()) THEN (user_id = auth.uid())
    ELSE validate_company_access(user_id)
  END
);

-- Update order_items to follow same logic as orders
DROP POLICY IF EXISTS "order_items_policy" ON public.order_items;
CREATE POLICY "order_items_conditional_access" ON public.order_items
FOR ALL
TO authenticated
USING (
  CASE 
    WHEN is_seller(auth.uid()) THEN (user_id = auth.uid())
    ELSE validate_company_access(user_id)
  END
)
WITH CHECK (
  CASE 
    WHEN is_seller(auth.uid()) THEN (user_id = auth.uid())
    ELSE validate_company_access(user_id)
  END
);

-- Update tables with user_id to use company-wide access
DROP POLICY IF EXISTS "production_company_access" ON public.production;
CREATE POLICY "production_company_access" ON public.production
FOR ALL
TO authenticated
USING (validate_company_access(user_id))
WITH CHECK (validate_company_access(user_id));

DROP POLICY IF EXISTS "packaging_company_access" ON public.packaging;
CREATE POLICY "packaging_company_access" ON public.packaging
FOR ALL
TO authenticated
USING (validate_company_access(user_id))
WITH CHECK (validate_company_access(user_id));

DROP POLICY IF EXISTS "financial_entries_company_access" ON public.financial_entries;
CREATE POLICY "financial_entries_company_access" ON public.financial_entries
FOR ALL
TO authenticated
USING (validate_company_access(user_id))
WITH CHECK (validate_company_access(user_id));

DROP POLICY IF EXISTS "purchases_company_access" ON public.purchases;
CREATE POLICY "purchases_company_access" ON public.purchases
FOR ALL
TO authenticated
USING (validate_company_access(user_id))
WITH CHECK (validate_company_access(user_id));

DROP POLICY IF EXISTS "purchase_items_company_access" ON public.purchase_items;
CREATE POLICY "purchase_items_company_access" ON public.purchase_items
FOR ALL
TO authenticated
USING (validate_company_access(user_id))
WITH CHECK (validate_company_access(user_id));

DROP POLICY IF EXISTS "product_categories_company_access" ON public.product_categories;
CREATE POLICY "product_categories_company_access" ON public.product_categories
FOR ALL
TO authenticated
USING (validate_company_access(user_id))
WITH CHECK (validate_company_access(user_id));

DROP POLICY IF EXISTS "product_recipes_company_access" ON public.product_recipes;
CREATE POLICY "product_recipes_company_access" ON public.product_recipes
FOR ALL
TO authenticated
USING (validate_company_access(user_id))
WITH CHECK (validate_company_access(user_id));

DROP POLICY IF EXISTS "perdas_company_access" ON public.perdas;
CREATE POLICY "perdas_company_access" ON public.perdas
FOR ALL
TO authenticated
USING (validate_company_access(user_id))
WITH CHECK (validate_company_access(user_id));

DROP POLICY IF EXISTS "service_orders_company_access" ON public.service_orders;
CREATE POLICY "service_orders_company_access" ON public.service_orders
FOR ALL
TO authenticated
USING (validate_company_access(user_id))
WITH CHECK (validate_company_access(user_id));

DROP POLICY IF EXISTS "route_assignments_company_access" ON public.route_assignments;
CREATE POLICY "route_assignments_company_access" ON public.route_assignments
FOR ALL
TO authenticated
USING (validate_company_access(user_id))
WITH CHECK (validate_company_access(user_id));

DROP POLICY IF EXISTS "route_items_company_access" ON public.route_items;
CREATE POLICY "route_items_company_access" ON public.route_items
FOR ALL
TO authenticated
USING (validate_company_access(user_id))
WITH CHECK (validate_company_access(user_id));

DROP POLICY IF EXISTS "notas_emitidas_company_access" ON public.notas_emitidas;
CREATE POLICY "notas_emitidas_company_access" ON public.notas_emitidas
FOR ALL
TO authenticated
USING (validate_company_access(user_id))
WITH CHECK (validate_company_access(user_id));

DROP POLICY IF EXISTS "fiscal_invoices_company_access" ON public.fiscal_invoices;
CREATE POLICY "fiscal_invoices_company_access" ON public.fiscal_invoices
FOR ALL
TO authenticated
USING (validate_company_access(user_id))
WITH CHECK (validate_company_access(user_id));