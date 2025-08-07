-- Atualizar pedidos existentes para numeração sequencial
WITH numbered_orders AS (
  SELECT 
    id,
    ROW_NUMBER() OVER (ORDER BY created_at) as seq_number
  FROM orders
  ORDER BY created_at
)
UPDATE orders 
SET order_number = LPAD(numbered_orders.seq_number::TEXT, 6, '0')
FROM numbered_orders
WHERE orders.id = numbered_orders.id;