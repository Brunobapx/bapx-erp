-- Corrigir relacionamentos entre tabelas para resolver erro de schema cache

-- Verificar e criar foreign keys que estão faltando
-- Entre sales e orders
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'sales_order_id_fkey'
  ) THEN
    ALTER TABLE public.sales 
    ADD CONSTRAINT sales_order_id_fkey 
    FOREIGN KEY (order_id) REFERENCES public.orders(id);
  END IF;
END $$;

-- Entre sales e clients
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'sales_client_id_fkey'
  ) THEN
    ALTER TABLE public.sales 
    ADD CONSTRAINT sales_client_id_fkey 
    FOREIGN KEY (client_id) REFERENCES public.clients(id);
  END IF;
END $$;

-- Entre orders e clients
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'orders_client_id_fkey'
  ) THEN
    ALTER TABLE public.orders 
    ADD CONSTRAINT orders_client_id_fkey 
    FOREIGN KEY (client_id) REFERENCES public.clients(id);
  END IF;
END $$;

-- Entre order_items e orders
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'order_items_order_id_fkey'
  ) THEN
    ALTER TABLE public.order_items 
    ADD CONSTRAINT order_items_order_id_fkey 
    FOREIGN KEY (order_id) REFERENCES public.orders(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Entre order_items e products
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'order_items_product_id_fkey'
  ) THEN
    ALTER TABLE public.order_items 
    ADD CONSTRAINT order_items_product_id_fkey 
    FOREIGN KEY (product_id) REFERENCES public.products(id);
  END IF;
END $$;

-- Entre financial_entries e orders
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'financial_entries_order_id_fkey'
  ) THEN
    ALTER TABLE public.financial_entries 
    ADD CONSTRAINT financial_entries_order_id_fkey 
    FOREIGN KEY (order_id) REFERENCES public.orders(id);
  END IF;
END $$;

-- Entre financial_entries e sales
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'financial_entries_sale_id_fkey'
  ) THEN
    ALTER TABLE public.financial_entries 
    ADD CONSTRAINT financial_entries_sale_id_fkey 
    FOREIGN KEY (sale_id) REFERENCES public.sales(id);
  END IF;
END $$;

-- Entre financial_entries e clients
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'financial_entries_client_id_fkey'
  ) THEN
    ALTER TABLE public.financial_entries 
    ADD CONSTRAINT financial_entries_client_id_fkey 
    FOREIGN KEY (client_id) REFERENCES public.clients(id);
  END IF;
END $$;