-- Remove duplicate foreign key constraint
ALTER TABLE order_items DROP CONSTRAINT IF EXISTS order_items_order_id_fkey;