-- Atualizar função para incluir tabela trocas
CREATE OR REPLACE FUNCTION public.generate_sequence_number(prefix text, table_name text, user_id uuid)
 RETURNS text
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
  next_number INTEGER;
  formatted_number TEXT;
BEGIN
  -- Buscar o próximo número GLOBAL (sem filtrar por user_id)
  EXECUTE format('SELECT COALESCE(MAX(CAST(SUBSTRING(%I FROM ''^%s-(\d+)$'') AS INTEGER)), 0) + 1 FROM %I', 
    CASE 
      WHEN table_name = 'orders' THEN 'order_number'
      WHEN table_name = 'production' THEN 'production_number'
      WHEN table_name = 'packaging' THEN 'packaging_number'
      WHEN table_name = 'sales' THEN 'sale_number'
      WHEN table_name = 'financial_entries' THEN 'entry_number'
      WHEN table_name = 'delivery_routes' THEN 'route_number'
      WHEN table_name = 'trocas' THEN 'numero_troca'
    END,
    prefix, 
    table_name
  ) INTO next_number;
  
  formatted_number := prefix || '-' || LPAD(next_number::TEXT, 3, '0');
  RETURN formatted_number;
END;
$function$;