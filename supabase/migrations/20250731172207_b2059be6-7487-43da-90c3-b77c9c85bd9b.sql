-- Fix remaining functions to include SET search_path = '' for security

-- 1. Fix update_updated_at_column function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$function$;

-- 2. Fix update_fiscal_invoices_updated_at function
CREATE OR REPLACE FUNCTION public.update_fiscal_invoices_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$function$;

-- 3. Fix update_nota_configuracoes_updated_at function
CREATE OR REPLACE FUNCTION public.update_nota_configuracoes_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$function$;

-- 4. Fix update_notas_emitidas_updated_at function
CREATE OR REPLACE FUNCTION public.update_notas_emitidas_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$function$;

-- 5. Fix update_seller_commissions_updated_at function
CREATE OR REPLACE FUNCTION public.update_seller_commissions_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$function$;

-- 6. Fix update_backup_history_updated_at function
CREATE OR REPLACE FUNCTION public.update_backup_history_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$function$;

-- 7. Fix set_commission_payment_number function
CREATE OR REPLACE FUNCTION public.set_commission_payment_number()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
BEGIN
  IF NEW.payment_number IS NULL OR NEW.payment_number = '' THEN
    NEW.payment_number := public.generate_sequence_number('COM', 'commission_payments', NEW.user_id);
  END IF;
  RETURN NEW;
END;
$function$;

-- 8. Fix set_troca_number function
CREATE OR REPLACE FUNCTION public.set_troca_number()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
BEGIN
  IF NEW.numero_troca IS NULL OR NEW.numero_troca = '' THEN
    NEW.numero_troca := public.generate_sequence_number('TRC', 'trocas', NEW.user_id);
  END IF;
  RETURN NEW;
END;
$function$;

-- 9. Fix set_order_number function
CREATE OR REPLACE FUNCTION public.set_order_number()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
BEGIN
  IF NEW.order_number IS NULL OR NEW.order_number = '' THEN
    NEW.order_number := public.generate_sequence_number('PED', 'orders', NEW.user_id);
  END IF;
  RETURN NEW;
END;
$function$;

-- 10. Fix set_production_number function
CREATE OR REPLACE FUNCTION public.set_production_number()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
BEGIN
  IF NEW.production_number IS NULL OR NEW.production_number = '' THEN
    NEW.production_number := public.generate_sequence_number('PR', 'production', NEW.user_id);
  END IF;
  RETURN NEW;
END;
$function$;

-- 11. Fix set_sale_number function
CREATE OR REPLACE FUNCTION public.set_sale_number()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
BEGIN
  IF NEW.sale_number IS NULL OR NEW.sale_number = '' THEN
    NEW.sale_number := public.generate_sequence_number('V', 'sales', NEW.user_id);
  END IF;
  RETURN NEW;
END;
$function$;

-- 12. Fix set_entry_number function
CREATE OR REPLACE FUNCTION public.set_entry_number()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
BEGIN
  IF NEW.entry_number IS NULL OR NEW.entry_number = '' THEN
    NEW.entry_number := public.generate_sequence_number('F', 'financial_entries', NEW.user_id);
  END IF;
  RETURN NEW;
END;
$function$;

-- 13. Fix set_route_number function
CREATE OR REPLACE FUNCTION public.set_route_number()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
BEGIN
  IF NEW.route_number IS NULL OR NEW.route_number = '' THEN
    NEW.route_number := public.generate_sequence_number('RT', 'delivery_routes', NEW.user_id);
  END IF;
  RETURN NEW;
END;
$function$;

-- 14. Fix set_packaging_number function
CREATE OR REPLACE FUNCTION public.set_packaging_number()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
BEGIN
  IF NEW.packaging_number IS NULL OR NEW.packaging_number = '' THEN
    NEW.packaging_number := public.generate_sequence_number('EMB', 'packaging', NEW.user_id);
  END IF;
  RETURN NEW;
END;
$function$;

-- 15. Fix set_os_number function
CREATE OR REPLACE FUNCTION public.set_os_number()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
BEGIN
  IF NEW.os_number IS NULL OR NEW.os_number = '' THEN
    NEW.os_number := public.generate_sequence_number('OS', 'service_orders', NEW.user_id);
  END IF;
  RETURN NEW;
END;
$function$;

-- 16. Fix has_module_permission function
CREATE OR REPLACE FUNCTION public.has_module_permission(user_id uuid, module_route text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
BEGIN
  -- Admin tem acesso a tudo
  IF public.is_admin(user_id) THEN
    RETURN TRUE;
  END IF;
  
  -- Verificar se tem permissão específica
  RETURN EXISTS (
    SELECT 1 
    FROM public.user_module_permissions ump
    JOIN public.system_modules sm ON ump.module_id = sm.id
    WHERE ump.user_id = $1 AND sm.route_path = $2
  );
END;
$function$;

-- 17. Fix get_technicians function  
CREATE OR REPLACE FUNCTION public.get_technicians()
RETURNS TABLE(id uuid, first_name text, last_name text, email text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
BEGIN
  RETURN QUERY
  SELECT 
    au.id,
    COALESCE(au.raw_user_meta_data ->> 'first_name', '')::text as first_name,
    COALESCE(au.raw_user_meta_data ->> 'last_name', '')::text as last_name,
    au.email::text
  FROM auth.users au
  INNER JOIN public.user_positions up ON au.id = up.user_id
  WHERE up.position = 'tecnico'
    AND au.deleted_at IS NULL;
END;
$function$;

-- 18. Fix get_row_count function
CREATE OR REPLACE FUNCTION public.get_row_count(table_name text)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
DECLARE
  row_count integer;
BEGIN
  EXECUTE format('SELECT COUNT(*) FROM public.%I', table_name) INTO row_count;
  RETURN row_count;
EXCEPTION
  WHEN undefined_table THEN
    RETURN 0;
  WHEN insufficient_privilege THEN
    RETURN 0;
END;
$function$;