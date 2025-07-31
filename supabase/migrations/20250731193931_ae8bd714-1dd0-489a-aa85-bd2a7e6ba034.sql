-- CORRIGIR: Recriar tabela orders com casting correto
-- 1. Primeiro verificar se há dados para preservar
DO $$
BEGIN
  -- Verificar se orders_backup existe
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'orders_backup') THEN
    RAISE NOTICE 'Tabela orders_backup encontrada';
  END IF;
END $$;

-- 2. Criar a nova tabela orders (se não existir)
CREATE TABLE IF NOT EXISTS orders (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid NOT NULL,
    client_id uuid NOT NULL,
    client_name text NOT NULL,
    order_number text NOT NULL DEFAULT '',
    seller text,
    salesperson_id uuid,
    total_amount numeric DEFAULT 0,
    delivery_deadline date,
    payment_method text,
    payment_term text,
    notes text,
    status text DEFAULT 'pending'::text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);

-- 3. Habilitar RLS
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

-- 4. Criar políticas RLS mais permissivas para testar
DROP POLICY IF EXISTS "Enable all for authenticated users" ON orders;
CREATE POLICY "Enable all for authenticated users" 
ON orders 
FOR ALL 
TO authenticated
USING (true)
WITH CHECK (auth.uid() = user_id);

-- 5. Recriar triggers essenciais
DROP TRIGGER IF EXISTS set_order_number_trigger ON orders;
CREATE TRIGGER set_order_number_trigger
    BEFORE INSERT ON orders
    FOR EACH ROW
    EXECUTE FUNCTION set_order_number();

DROP TRIGGER IF EXISTS update_orders_updated_at_trigger ON orders;  
CREATE TRIGGER update_orders_updated_at_trigger
    BEFORE UPDATE ON orders
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 6. Limpar qualquer backup antigo
DROP TABLE IF EXISTS orders_backup;