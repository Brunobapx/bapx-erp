-- Corrigir as políticas RLS para orders permitir que vendedores vejam seus pedidos
DROP POLICY IF EXISTS "orders_conditional_access" ON orders;

-- Nova política que permite vendedores verem pedidos onde são o seller_id
CREATE POLICY "orders_seller_access" ON orders
FOR ALL
TO authenticated
USING (
  CASE
    WHEN is_seller(auth.uid()) THEN (seller_id = auth.uid())
    ELSE validate_company_access(user_id)
  END
)
WITH CHECK (
  CASE
    WHEN is_seller(auth.uid()) THEN (seller_id = auth.uid())
    ELSE validate_company_access(user_id)
  END
);

-- Também ajustar order_items para seguir a mesma lógica
DROP POLICY IF EXISTS "order_items_conditional_access" ON order_items;

CREATE POLICY "order_items_seller_access" ON order_items
FOR ALL
TO authenticated
USING (
  CASE
    WHEN is_seller(auth.uid()) THEN (
      order_id IN (
        SELECT id FROM orders WHERE seller_id = auth.uid()
      )
    )
    ELSE validate_company_access(user_id)
  END
)
WITH CHECK (
  CASE
    WHEN is_seller(auth.uid()) THEN (
      order_id IN (
        SELECT id FROM orders WHERE seller_id = auth.uid()
      )
    )
    ELSE validate_company_access(user_id)
  END
);