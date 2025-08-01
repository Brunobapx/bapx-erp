-- Verificar e ajustar o trigger para garantir numeração sequencial
DROP TRIGGER IF EXISTS set_order_number_trigger ON orders;

-- Recriar o trigger
CREATE TRIGGER set_order_number_trigger
  BEFORE INSERT ON orders
  FOR EACH ROW
  EXECUTE FUNCTION set_order_number();

-- Atualizar a função set_order_number para usar apenas números sequenciais
CREATE OR REPLACE FUNCTION public.set_order_number()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
DECLARE
  next_number INTEGER;
BEGIN
  IF NEW.order_number IS NULL OR NEW.order_number = '' THEN
    -- Buscar o próximo número sequencial simples
    SELECT COALESCE(MAX(CAST(order_number AS INTEGER)), 0) + 1 
    FROM orders 
    WHERE order_number ~ '^\d+$'  -- Apenas números
    INTO next_number;
    
    -- Definir o número com 6 dígitos
    NEW.order_number := LPAD(next_number::TEXT, 6, '0');
  END IF;
  RETURN NEW;
END;
$function$