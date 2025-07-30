-- Verificar se a tabela service_orders existe e criar o trigger para os_number
-- Primeiro, garantir que a tabela service_orders existe com a estrutura correta
CREATE TABLE IF NOT EXISTS public.service_orders (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  os_number text NOT NULL,
  opened_at timestamp with time zone NOT NULL DEFAULT now(),
  client_id uuid NOT NULL,
  technician_id uuid NOT NULL,
  service_type text NOT NULL,
  description text,
  priority text NOT NULL,
  status text NOT NULL DEFAULT 'Aberta',
  contract_service boolean NOT NULL DEFAULT false,
  service_value numeric,
  total_value numeric,
  notes text,
  receivable_id uuid,
  user_id uuid NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.service_orders ENABLE ROW LEVEL SECURITY;

-- Criar políticas RLS se não existirem
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'service_orders' 
    AND policyname = 'Authenticated users can manage all service orders'
  ) THEN
    CREATE POLICY "Authenticated users can manage all service orders" 
    ON public.service_orders 
    FOR ALL 
    USING (auth.uid() IS NOT NULL)
    WITH CHECK (auth.uid() IS NOT NULL);
  END IF;
END $$;

-- Criar o trigger para gerar os_number automaticamente
CREATE OR REPLACE FUNCTION public.set_os_number()
RETURNS trigger
LANGUAGE plpgsql
AS $function$
BEGIN
  IF NEW.os_number IS NULL OR NEW.os_number = '' THEN
    NEW.os_number := generate_sequence_number('OS', 'service_orders', NEW.user_id);
  END IF;
  RETURN NEW;
END;
$function$;

-- Criar o trigger se não existir
DROP TRIGGER IF EXISTS set_service_order_os_number ON public.service_orders;
CREATE TRIGGER set_service_order_os_number
  BEFORE INSERT ON public.service_orders
  FOR EACH ROW
  EXECUTE FUNCTION public.set_os_number();

-- Criar trigger para updated_at
DROP TRIGGER IF EXISTS update_service_orders_updated_at ON public.service_orders;
CREATE TRIGGER update_service_orders_updated_at
  BEFORE UPDATE ON public.service_orders
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();