-- Corrigir problema da sequência orders_sequence
-- A função set_order_number estava tentando usar uma sequência que não existe

-- Remover a sequência que criamos (se existir)
DROP SEQUENCE IF EXISTS orders_sequence;

-- Recriar a função set_order_number para usar a função generate_sequence_number que já existe
CREATE OR REPLACE FUNCTION public.set_order_number()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
BEGIN
  IF NEW.order_number IS NULL OR NEW.order_number = '' THEN
    NEW.order_number := public.generate_sequence_number('PED', 'orders', NEW.user_id);
  END IF;
  RETURN NEW;
END;
$function$;

-- Verificar se o trigger existe e recriar se necessário
DROP TRIGGER IF EXISTS set_order_number_trigger ON public.orders;
CREATE TRIGGER set_order_number_trigger
    BEFORE INSERT ON public.orders
    FOR EACH ROW
    EXECUTE FUNCTION public.set_order_number();