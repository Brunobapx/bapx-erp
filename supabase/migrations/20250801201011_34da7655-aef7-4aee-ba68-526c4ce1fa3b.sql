-- STEP 1: Limpar tudo existente relacionado a orders
-- Remover triggers
DROP TRIGGER IF EXISTS set_order_number_trigger ON public.orders;
DROP TRIGGER IF EXISTS audit_orders_changes_trigger ON public.orders;
DROP TRIGGER IF EXISTS update_orders_updated_at ON public.orders;

-- Remover tabelas existentes
DROP TABLE IF EXISTS public.order_items CASCADE;
DROP TABLE IF EXISTS public.orders CASCADE;

-- STEP 2: Criar estrutura nova e simples
-- Tabela de pedidos minimalista
CREATE TABLE public.orders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  order_number TEXT NOT NULL DEFAULT '',
  client_id UUID NOT NULL,
  client_name TEXT NOT NULL,
  total_amount NUMERIC NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pending',
  delivery_deadline DATE,
  payment_method TEXT,
  payment_term TEXT,
  notes TEXT,
  user_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela de itens do pedido minimalista
CREATE TABLE public.order_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  product_id UUID NOT NULL,
  product_name TEXT NOT NULL,
  quantity INTEGER NOT NULL,
  unit_price NUMERIC NOT NULL,
  total_price NUMERIC NOT NULL,
  user_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- RLS simples e funcional
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

-- Policies simples que funcionam
CREATE POLICY "orders_policy" ON public.orders FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "order_items_policy" ON public.order_items FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Trigger simples apenas para updated_at
CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON public.orders FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_order_items_updated_at BEFORE UPDATE ON public.order_items FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();