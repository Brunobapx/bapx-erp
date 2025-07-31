-- Remover definitivamente o trigger problemático que causa conflitos
DROP TRIGGER IF EXISTS trigger_handle_order_flow ON orders;

-- Remover também a função que não será mais usada
DROP FUNCTION IF EXISTS public.handle_order_flow();

-- Manter apenas os triggers essenciais:
-- 1. set_order_number - para numeração automática  
-- 2. update_orders_updated_at - para timestamp

-- Verificar se os triggers essenciais existem, caso contrário recriar
DO $$
BEGIN
  -- Trigger para numeração automática
  IF NOT EXISTS (SELECT 1 FROM information_schema.triggers WHERE trigger_name = 'set_order_number_trigger') THEN
    CREATE TRIGGER set_order_number_trigger
      BEFORE INSERT ON orders
      FOR EACH ROW
      EXECUTE FUNCTION set_order_number();
  END IF;
  
  -- Trigger para timestamp
  IF NOT EXISTS (SELECT 1 FROM information_schema.triggers WHERE trigger_name = 'update_orders_updated_at_trigger') THEN
    CREATE TRIGGER update_orders_updated_at_trigger
      BEFORE UPDATE ON orders
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;