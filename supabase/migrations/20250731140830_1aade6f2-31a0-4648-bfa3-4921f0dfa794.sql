-- Criar tabela orders se não existir
CREATE TABLE IF NOT EXISTS public.orders (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  order_number text NOT NULL,
  user_id uuid NOT NULL,
  client_id uuid NOT NULL,
  client_name text NOT NULL,
  seller text,
  status text DEFAULT 'pending',
  total_amount numeric DEFAULT 0,
  delivery_deadline date,
  payment_method text,
  payment_term text,
  notes text,
  salesperson_id uuid,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

-- Criar políticas RLS para orders
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'orders' 
    AND policyname = 'Users can view orders based on role'
  ) THEN
    CREATE POLICY "Users can view orders based on role" 
    ON public.orders 
    FOR SELECT 
    USING (
      (auth.jwt() ->> 'role' = 'service_role') OR 
      (auth.uid() IS NOT NULL AND (
        (is_seller(auth.uid()) AND user_id = auth.uid()) OR 
        (NOT is_seller(auth.uid()))
      ))
    );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'orders' 
    AND policyname = 'Sellers can only manage their own orders'
  ) THEN
    CREATE POLICY "Sellers can only manage their own orders" 
    ON public.orders 
    FOR INSERT 
    WITH CHECK (auth.uid() IS NOT NULL);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'orders' 
    AND policyname = 'Sellers can only update their own orders'
  ) THEN
    CREATE POLICY "Sellers can only update their own orders" 
    ON public.orders 
    FOR UPDATE 
    USING (
      (NOT is_seller(auth.uid())) OR 
      (is_seller(auth.uid()) AND user_id = auth.uid())
    );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'orders' 
    AND policyname = 'Sellers can only delete their own orders'
  ) THEN
    CREATE POLICY "Sellers can only delete their own orders" 
    ON public.orders 
    FOR DELETE 
    USING (
      (NOT is_seller(auth.uid())) OR 
      (is_seller(auth.uid()) AND user_id = auth.uid())
    );
  END IF;
END $$;

-- Criar função para gerar order_number automaticamente
CREATE OR REPLACE FUNCTION public.set_order_number()
RETURNS trigger
LANGUAGE plpgsql
AS $function$
BEGIN
  IF NEW.order_number IS NULL OR NEW.order_number = '' THEN
    NEW.order_number := generate_sequence_number('PED', 'orders', NEW.user_id);
  END IF;
  RETURN NEW;
END;
$function$;

-- Criar o trigger para order_number
DROP TRIGGER IF EXISTS set_order_order_number ON public.orders;
CREATE TRIGGER set_order_order_number
  BEFORE INSERT ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.set_order_number();

-- Criar trigger para updated_at
DROP TRIGGER IF EXISTS update_orders_updated_at ON public.orders;
CREATE TRIGGER update_orders_updated_at
  BEFORE UPDATE ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();