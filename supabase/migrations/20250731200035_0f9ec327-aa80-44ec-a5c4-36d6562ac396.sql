-- Recriar tabela order_items para garantir compatibilidade
CREATE TABLE IF NOT EXISTS order_items (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid NOT NULL,
    order_id uuid NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    product_id uuid NOT NULL,
    product_name text NOT NULL,
    quantity integer NOT NULL,
    unit_price numeric NOT NULL,
    total_price numeric NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);

-- Habilitar RLS para order_items
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

-- Política RLS para order_items
DROP POLICY IF EXISTS "Enable all for authenticated users" ON order_items;
CREATE POLICY "Enable all for authenticated users" 
ON order_items 
FOR ALL 
TO authenticated
USING (true)
WITH CHECK (auth.uid() = user_id);

-- Trigger para timestamp
DROP TRIGGER IF EXISTS update_order_items_updated_at_trigger ON order_items;
CREATE TRIGGER update_order_items_updated_at_trigger
    BEFORE UPDATE ON order_items
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();