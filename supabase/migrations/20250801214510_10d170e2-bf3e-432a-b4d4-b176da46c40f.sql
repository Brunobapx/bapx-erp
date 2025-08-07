-- Drop existing orders policy and create new conditional policy
DROP POLICY IF EXISTS "orders_policy" ON public.orders;

-- Create conditional policy for orders - allows company access but restricts sellers to their own orders
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

-- Update other tables to use company-wide access (remove restrictive policies)
DROP POLICY IF EXISTS "Authenticated users can manage all production" ON public.production;
CREATE POLICY "production_company_access" ON public.production
FOR ALL
TO authenticated
USING (validate_company_access(user_id))
WITH CHECK (validate_company_access(user_id));

DROP POLICY IF EXISTS "Authenticated users can manage all packaging" ON public.packaging;
CREATE POLICY "packaging_company_access" ON public.packaging
FOR ALL
TO authenticated
USING (validate_company_access(user_id))
WITH CHECK (validate_company_access(user_id));

DROP POLICY IF EXISTS "Authenticated users can manage all financial entries" ON public.financial_entries;
CREATE POLICY "financial_entries_company_access" ON public.financial_entries
FOR ALL
TO authenticated
USING (validate_company_access(user_id))
WITH CHECK (validate_company_access(user_id));

DROP POLICY IF EXISTS "Authenticated users can manage all delivery routes" ON public.delivery_routes;
CREATE POLICY "delivery_routes_company_access" ON public.delivery_routes
FOR ALL
TO authenticated
USING (validate_company_access(user_id))
WITH CHECK (validate_company_access(user_id));

DROP POLICY IF EXISTS "Authenticated users can manage all purchases" ON public.purchases;
CREATE POLICY "purchases_company_access" ON public.purchases
FOR ALL
TO authenticated
USING (validate_company_access(user_id))
WITH CHECK (validate_company_access(user_id));

DROP POLICY IF EXISTS "Authenticated users can manage all purchase items" ON public.purchase_items;
CREATE POLICY "purchase_items_company_access" ON public.purchase_items
FOR ALL
TO authenticated
USING (validate_company_access(user_id))
WITH CHECK (validate_company_access(user_id));

DROP POLICY IF EXISTS "Authenticated users can manage all categories" ON public.product_categories;
CREATE POLICY "product_categories_company_access" ON public.product_categories
FOR ALL
TO authenticated
USING (validate_company_access(user_id))
WITH CHECK (validate_company_access(user_id));

DROP POLICY IF EXISTS "Authenticated users can manage all recipes" ON public.product_recipes;
CREATE POLICY "product_recipes_company_access" ON public.product_recipes
FOR ALL
TO authenticated
USING (validate_company_access(user_id))
WITH CHECK (validate_company_access(user_id));

DROP POLICY IF EXISTS "Authenticated users can manage all perdas" ON public.perdas;
CREATE POLICY "perdas_company_access" ON public.perdas
FOR ALL
TO authenticated
USING (validate_company_access(user_id))
WITH CHECK (validate_company_access(user_id));

DROP POLICY IF EXISTS "Authenticated users can manage all service orders" ON public.service_orders;
CREATE POLICY "service_orders_company_access" ON public.service_orders
FOR ALL
TO authenticated
USING (validate_company_access(user_id))
WITH CHECK (validate_company_access(user_id));

DROP POLICY IF EXISTS "Authenticated users can manage all service order materials" ON public.service_order_materials;
CREATE POLICY "service_order_materials_company_access" ON public.service_order_materials
FOR ALL
TO authenticated
USING (validate_company_access(user_id))
WITH CHECK (validate_company_access(user_id));

DROP POLICY IF EXISTS "Authenticated users can manage all service order attachments" ON public.service_order_attachments;
CREATE POLICY "service_order_attachments_company_access" ON public.service_order_attachments
FOR ALL
TO authenticated
USING (validate_company_access(user_id))
WITH CHECK (validate_company_access(user_id));

DROP POLICY IF EXISTS "Authenticated users can manage all route assignments" ON public.route_assignments;
CREATE POLICY "route_assignments_company_access" ON public.route_assignments
FOR ALL
TO authenticated
USING (validate_company_access(user_id))
WITH CHECK (validate_company_access(user_id));

DROP POLICY IF EXISTS "Authenticated users can manage all route items" ON public.route_items;
CREATE POLICY "route_items_company_access" ON public.route_items
FOR ALL
TO authenticated
USING (validate_company_access(user_id))
WITH CHECK (validate_company_access(user_id));

DROP POLICY IF EXISTS "Authenticated users can manage all fiscal invoices" ON public.fiscal_invoices;
CREATE POLICY "fiscal_invoices_company_access" ON public.fiscal_invoices
FOR ALL
TO authenticated
USING (validate_company_access(user_id))
WITH CHECK (validate_company_access(user_id));

DROP POLICY IF EXISTS "Authenticated users can manage all notas emitidas" ON public.notas_emitidas;
CREATE POLICY "notas_emitidas_company_access" ON public.notas_emitidas
FOR ALL
TO authenticated
USING (validate_company_access(user_id))
WITH CHECK (validate_company_access(user_id));

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