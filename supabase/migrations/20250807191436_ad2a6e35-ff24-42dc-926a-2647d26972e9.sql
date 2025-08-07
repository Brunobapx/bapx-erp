-- Fix functions that reference orders without schema, causing "relation 'orders' does not exist"
-- We fully-qualify tables with public schema and keep search_path empty for safety

-- 1) generate_sequence_number: qualify orders and dynamic tables with public.%I
CREATE OR REPLACE FUNCTION public.generate_sequence_number(prefix text, table_name text, user_id uuid)
 RETURNS text
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
DECLARE
  next_number INTEGER;
  formatted_number TEXT;
BEGIN
  -- Para pedidos, usar numeração sequencial simples sem prefixo
  IF table_name = 'orders' THEN
    -- Buscar o próximo número sequencial simples na tabela pública
    SELECT COALESCE(MAX(CAST(order_number AS INTEGER)), 0) + 1 
    INTO next_number
    FROM public.orders 
    WHERE order_number ~ '^\d+$';  -- Apenas números
    
    -- Retornar apenas o número sem prefixo
    RETURN LPAD(next_number::TEXT, 6, '0');
  END IF;
  
  -- Para outras tabelas, manter o comportamento anterior (com schema público)
  EXECUTE format(
    'SELECT COALESCE(MAX(CAST(SUBSTRING(%I FROM ''^%s-(\d+)$'') AS INTEGER)), 0) + 1 FROM public.%I', 
    CASE 
      WHEN table_name = 'production' THEN 'production_number'
      WHEN table_name = 'packaging' THEN 'packaging_number'
      WHEN table_name = 'sales' THEN 'sale_number'
      WHEN table_name = 'financial_entries' THEN 'entry_number'
      WHEN table_name = 'delivery_routes' THEN 'route_number'
      WHEN table_name = 'trocas' THEN 'numero_troca'
      WHEN table_name = 'service_orders' THEN 'os_number'
      WHEN table_name = 'commission_payments' THEN 'payment_number'
    END,
    prefix, 
    table_name
  ) INTO next_number;
  
  formatted_number := prefix || '-' || LPAD(next_number::TEXT, 3, '0');
  RETURN formatted_number;
END;
$function$;

-- 2) set_order_number: qualify orders with public.orders
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
    -- Buscar o próximo número sequencial simples na tabela pública
    SELECT COALESCE(MAX(CAST(order_number AS INTEGER)), 0) + 1 
    INTO next_number
    FROM public.orders 
    WHERE order_number ~ '^\d+$';  -- Apenas números
    
    -- Definir o número com 6 dígitos
    NEW.order_number := LPAD(next_number::TEXT, 6, '0');
  END IF;
  RETURN NEW;
END;
$function$;
