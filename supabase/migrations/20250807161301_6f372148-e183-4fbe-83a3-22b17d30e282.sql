-- Verificar e criar outras foreign keys necessárias

-- order_items -> orders
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'fk_order_items_order_id'
    ) THEN
        ALTER TABLE public.order_items 
        ADD CONSTRAINT fk_order_items_order_id 
        FOREIGN KEY (order_id) 
        REFERENCES public.orders(id) 
        ON DELETE CASCADE;
    END IF;
END $$;

-- orders -> clients  
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'fk_orders_client_id'
    ) THEN
        ALTER TABLE public.orders 
        ADD CONSTRAINT fk_orders_client_id 
        FOREIGN KEY (client_id) 
        REFERENCES public.clients(id) 
        ON DELETE RESTRICT;
    END IF;
END $$;