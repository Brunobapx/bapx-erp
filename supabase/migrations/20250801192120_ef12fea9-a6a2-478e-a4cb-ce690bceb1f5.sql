-- Garantir que as tabelas orders e order_items existem e estão configuradas corretamente

-- Criar tabela orders se não existir
CREATE TABLE IF NOT EXISTS public.orders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  client_id UUID NOT NULL,
  client_name TEXT NOT NULL,
  order_number TEXT NOT NULL,
  total_amount NUMERIC DEFAULT 0,
  status TEXT DEFAULT 'pending',
  payment_method TEXT,
  payment_term TEXT,
  notes TEXT,
  seller TEXT,
  delivery_deadline DATE,
  salesperson_id UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Criar tabela order_items se não existir
CREATE TABLE IF NOT EXISTS public.order_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  order_id UUID NOT NULL,
  product_id UUID NOT NULL,
  product_name TEXT NOT NULL,
  quantity INTEGER NOT NULL,
  unit_price NUMERIC NOT NULL,
  total_price NUMERIC NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Garantir RLS habilitado
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

-- Recriar políticas RLS para orders
DROP POLICY IF EXISTS "Users can manage their own orders" ON public.orders;
CREATE POLICY "Users can manage their own orders" 
ON public.orders 
FOR ALL 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Recriar políticas RLS para order_items
DROP POLICY IF EXISTS "Users can manage their own order items" ON public.order_items;
CREATE POLICY "Users can manage their own order items" 
ON public.order_items 
FOR ALL 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Garantir triggers para order_number
DROP TRIGGER IF EXISTS set_order_number_trigger ON public.orders;
CREATE TRIGGER set_order_number_trigger
  BEFORE INSERT ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.set_order_number();

-- Garantir triggers para updated_at
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