-- Adicionar foreign key relationship que está faltando
ALTER TABLE order_item_tracking 
ADD CONSTRAINT fk_order_item_tracking_order_items 
FOREIGN KEY (order_item_id) REFERENCES order_items(id) ON DELETE CASCADE;

-- Processar pedidos pendentes existentes
DO $$
DECLARE
    pending_order RECORD;
BEGIN
    FOR pending_order IN 
        SELECT id FROM orders WHERE status = 'pending'
    LOOP
        RAISE NOTICE 'Processando pedido %', pending_order.id;
    END LOOP;
END $$;