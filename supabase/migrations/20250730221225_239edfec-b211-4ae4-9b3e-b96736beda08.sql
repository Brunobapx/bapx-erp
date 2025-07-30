-- Adicionar trigger para gerar número da OS automaticamente
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

-- Criar trigger para service_orders
DROP TRIGGER IF EXISTS set_service_order_number ON public.service_orders;
CREATE TRIGGER set_service_order_number
  BEFORE INSERT ON public.service_orders
  FOR EACH ROW
  EXECUTE FUNCTION public.set_os_number();