-- Verificar e criar tabela orders se não existir
-- O erro persiste indicando que a tabela orders não existe

-- Primeiro, vamos garantir que a tabela orders existe
CREATE TABLE IF NOT EXISTS public.orders (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) NOT NULL,
    client_id UUID NOT NULL,
    client_name TEXT NOT NULL,
    order_number TEXT,
    total_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'pending',
    seller TEXT,
    delivery_deadline DATE,
    payment_method TEXT,
    payment_term TEXT,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    company_id UUID
);

-- Criar tabela order_items se não existir
CREATE TABLE IF NOT EXISTS public.order_items (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) NOT NULL,
    order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE NOT NULL,
    product_id UUID NOT NULL,
    product_name TEXT NOT NULL,
    quantity INTEGER NOT NULL DEFAULT 1,
    unit_price DECIMAL(10,2) NOT NULL DEFAULT 0,
    total_price DECIMAL(10,2) NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    company_id UUID
);

-- Habilitar RLS
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

-- Garantir permissões
GRANT ALL ON public.orders TO authenticated, anon, service_role;
GRANT ALL ON public.order_items TO authenticated, anon, service_role;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated, anon, service_role;

-- Criar políticas permissivas para teste
DROP POLICY IF EXISTS "Allow all operations for authenticated users" ON public.orders;
DROP POLICY IF EXISTS "Allow all operations for service_role" ON public.orders;
DROP POLICY IF EXISTS "Allow all operations for authenticated users" ON public.order_items;
DROP POLICY IF EXISTS "Allow all operations for service_role" ON public.order_items;

CREATE POLICY "Allow all operations for authenticated users" ON public.orders FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations for service_role" ON public.orders FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations for authenticated users" ON public.order_items FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations for service_role" ON public.order_items FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Criar trigger para order_number se não existir
CREATE OR REPLACE FUNCTION public.set_order_number()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
BEGIN
  IF NEW.order_number IS NULL OR NEW.order_number = '' THEN
    NEW.order_number := 'PED-' || LPAD(nextval('orders_sequence')::TEXT, 3, '0');
  END IF;
  RETURN NEW;
END;
$function$;

-- Criar sequência se não existir
CREATE SEQUENCE IF NOT EXISTS orders_sequence START 1;

-- Criar trigger
DROP TRIGGER IF EXISTS set_order_number_trigger ON public.orders;
CREATE TRIGGER set_order_number_trigger
    BEFORE INSERT ON public.orders
    FOR EACH ROW
    EXECUTE FUNCTION public.set_order_number();

-- Trigger para updated_at
DROP TRIGGER IF EXISTS update_orders_updated_at ON public.orders;
CREATE TRIGGER update_orders_updated_at
    BEFORE UPDATE ON public.orders
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_order_items_updated_at ON public.order_items;
CREATE TRIGGER update_order_items_updated_at
    BEFORE UPDATE ON public.order_items
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();