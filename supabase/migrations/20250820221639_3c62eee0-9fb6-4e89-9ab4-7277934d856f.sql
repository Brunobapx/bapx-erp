-- Fix generate_sequence_number function to include missing cases for quotes and quote_items
CREATE OR REPLACE FUNCTION public.generate_sequence_number(prefix text, table_name text, user_id uuid)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  company uuid;
  seq_key text;
  new_number integer;
  formatted text;
  number_column text;
  updated_row RECORD;
BEGIN
  -- Get user's company
  SELECT company_id INTO company FROM public.profiles WHERE id = user_id;

  -- Sequence key is the table name
  seq_key := table_name;

  -- Backward compatibility when company is null -> use global max logic
  IF company IS NULL THEN
    IF table_name = 'orders' THEN
      SELECT COALESCE(MAX(CAST(order_number AS INTEGER)), 0) + 1
      INTO new_number
      FROM public.orders 
      WHERE order_number ~ '^\d+$';
      RETURN LPAD(new_number::TEXT, 6, '0');
    ELSE
      number_column := CASE 
        WHEN table_name = 'production' THEN 'production_number'
        WHEN table_name = 'packaging' THEN 'packaging_number'
        WHEN table_name = 'sales' THEN 'sale_number'
        WHEN table_name = 'financial_entries' THEN 'entry_number'
        WHEN table_name = 'delivery_routes' THEN 'route_number'
        WHEN table_name = 'service_orders' THEN 'os_number'
        WHEN table_name = 'commission_payments' THEN 'payment_number'
        WHEN table_name = 'trocas' THEN 'numero_troca'
        WHEN table_name = 'fiscal_invoices' THEN 'invoice_number'
        WHEN table_name = 'notas_emitidas' THEN 'numero_nota'
        WHEN table_name = 'quotes' THEN 'quote_number'
        WHEN table_name = 'quote_items' THEN 'id'
      END;
      EXECUTE format(
        'SELECT COALESCE(MAX(CAST(SUBSTRING(%I FROM ''^%s-(\d+)$'') AS INTEGER)), 0) + 1 FROM public.%I',
        number_column, prefix, table_name
      ) INTO new_number;
      RETURN prefix || '-' || LPAD(new_number::TEXT, 3, '0');
    END IF;
  END IF;

  -- Try to increment existing company sequence atomically
  UPDATE public.company_sequences
     SET last_number = last_number + 1
   WHERE company_id = company AND sequence_key = seq_key
  RETURNING last_number INTO new_number;

  -- If no existing row, seed from current GLOBAL max to avoid duplicates
  IF NOT FOUND THEN
    IF table_name = 'orders' THEN
      SELECT COALESCE(MAX(CAST(order_number AS INTEGER)), 0) + 1
      INTO new_number
      FROM public.orders 
      WHERE order_number ~ '^\d+$';
    ELSE
      number_column := CASE 
        WHEN table_name = 'production' THEN 'production_number'
        WHEN table_name = 'packaging' THEN 'packaging_number'
        WHEN table_name = 'sales' THEN 'sale_number'
        WHEN table_name = 'financial_entries' THEN 'entry_number'
        WHEN table_name = 'delivery_routes' THEN 'route_number'
        WHEN table_name = 'service_orders' THEN 'os_number'
        WHEN table_name = 'commission_payments' THEN 'payment_number'
        WHEN table_name = 'trocas' THEN 'numero_troca'
        WHEN table_name = 'fiscal_invoices' THEN 'invoice_number'
        WHEN table_name = 'notas_emitidas' THEN 'numero_nota'
        WHEN table_name = 'quotes' THEN 'quote_number'
        WHEN table_name = 'quote_items' THEN 'id'
      END;
      EXECUTE format(
        'SELECT COALESCE(MAX(CAST(SUBSTRING(%I FROM ''^%s-(\d+)$'') AS INTEGER)), 0) + 1 FROM public.%I',
        number_column, prefix, table_name
      ) INTO new_number;
    END IF;

    -- Create the seed row with the computed number
    INSERT INTO public.company_sequences(company_id, sequence_key, last_number)
    VALUES (company, seq_key, new_number)
    ON CONFLICT (company_id, sequence_key)
    DO UPDATE SET last_number = EXCLUDED.last_number
    RETURNING last_number INTO new_number;
  END IF;

  -- Format result
  IF table_name = 'orders' THEN
    formatted := LPAD(new_number::TEXT, 6, '0');
  ELSE
    formatted := prefix || '-' || LPAD(new_number::TEXT, 3, '0');
  END IF;

  RETURN formatted;
END;
$function$;