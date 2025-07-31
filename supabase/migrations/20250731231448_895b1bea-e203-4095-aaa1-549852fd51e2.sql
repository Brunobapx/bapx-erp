-- Verificar e corrigir problemas com tabela orders

-- Garantir que estamos no schema correto
SET search_path TO public;

-- Dropar e recriar completamente a tabela orders
DROP TABLE IF EXISTS public.orders CASCADE;

-- Criar tabela orders com estrutura completa
CREATE TABLE public.orders (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid NOT NULL,
    client_id uuid NOT NULL,
    client_name text NOT NULL,
    order_number text NOT NULL,
    seller text,
    status text DEFAULT 'pending',
    total_amount numeric DEFAULT 0,
    delivery_deadline date,
    payment_method text,
    payment_term text,
    notes text,
    salesperson_id uuid,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);

-- Habilitar RLS
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

-- Criar política RLS mais permissiva
DROP POLICY IF EXISTS "Enable all for authenticated users" ON public.orders;
CREATE POLICY "Enable all for authenticated users" 
ON public.orders 
FOR ALL 
TO authenticated
USING (true)
WITH CHECK (true);

-- Recriar triggers
DROP TRIGGER IF EXISTS set_order_number_trigger ON public.orders;
CREATE TRIGGER set_order_number_trigger
    BEFORE INSERT ON public.orders
    FOR EACH ROW
    EXECUTE FUNCTION set_order_number();

DROP TRIGGER IF EXISTS update_orders_updated_at_trigger ON public.orders;
CREATE TRIGGER update_orders_updated_at_trigger
    BEFORE UPDATE ON public.orders
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Recriar tabela order_items se necessário
DROP TABLE IF EXISTS public.order_items CASCADE;
CREATE TABLE public.order_items (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid NOT NULL,
    order_id uuid NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
    product_id uuid NOT NULL,
    product_name text NOT NULL,
    quantity integer NOT NULL,
    unit_price numeric NOT NULL,
    total_price numeric NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);

-- Habilitar RLS para order_items
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

-- Política RLS para order_items
DROP POLICY IF EXISTS "Enable all for authenticated users" ON public.order_items;
CREATE POLICY "Enable all for authenticated users" 
ON public.order_items 
FOR ALL 
TO authenticated
USING (true)
WITH CHECK (true);

-- Trigger para timestamp
DROP TRIGGER IF EXISTS update_order_items_updated_at_trigger ON public.order_items;
CREATE TRIGGER update_order_items_updated_at_trigger
    BEFORE UPDATE ON public.order_items
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();