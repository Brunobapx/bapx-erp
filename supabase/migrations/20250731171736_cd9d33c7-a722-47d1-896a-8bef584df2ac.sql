-- PHASE 1: CRITICAL SECURITY FIXES
-- Re-enable RLS and implement proper company-based isolation

-- 1. Re-enable RLS on critical tables
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

-- 2. Drop overly permissive policies and create secure ones
DROP POLICY IF EXISTS "Authenticated users can delete orders" ON public.orders;
DROP POLICY IF EXISTS "Authenticated users can insert orders" ON public.orders;
DROP POLICY IF EXISTS "Authenticated users can select orders" ON public.orders;
DROP POLICY IF EXISTS "Authenticated users can update orders" ON public.orders;
DROP POLICY IF EXISTS "Authenticated users can manage order items" ON public.order_items;

-- 3. Create company-based isolation for orders
CREATE POLICY "Users can view orders from their company" ON public.orders
FOR SELECT USING (
  auth.uid() IS NOT NULL AND 
  user_id IN (
    SELECT id FROM auth.users 
    WHERE raw_user_meta_data->>'company_id' = 
          (SELECT raw_user_meta_data->>'company_id' FROM auth.users WHERE id = auth.uid())
  )
);

CREATE POLICY "Users can insert orders for their company" ON public.orders
FOR INSERT WITH CHECK (
  auth.uid() IS NOT NULL AND 
  user_id = auth.uid()
);

CREATE POLICY "Users can update their own orders or admins can update any" ON public.orders
FOR UPDATE USING (
  auth.uid() IS NOT NULL AND 
  (user_id = auth.uid() OR public.is_admin(auth.uid()))
);

CREATE POLICY "Users can delete their own orders or admins can delete any" ON public.orders
FOR DELETE USING (
  auth.uid() IS NOT NULL AND 
  (user_id = auth.uid() OR public.is_admin(auth.uid()))
);

-- 4. Create company-based isolation for order_items
CREATE POLICY "Users can view order items from their company" ON public.order_items
FOR SELECT USING (
  auth.uid() IS NOT NULL AND 
  order_id IN (
    SELECT id FROM public.orders 
    WHERE user_id IN (
      SELECT id FROM auth.users 
      WHERE raw_user_meta_data->>'company_id' = 
            (SELECT raw_user_meta_data->>'company_id' FROM auth.users WHERE id = auth.uid())
    )
  )
);

CREATE POLICY "Users can insert order items for their orders" ON public.order_items
FOR INSERT WITH CHECK (
  auth.uid() IS NOT NULL AND 
  user_id = auth.uid() AND
  order_id IN (SELECT id FROM public.orders WHERE user_id = auth.uid())
);

CREATE POLICY "Users can update their own order items or admins can update any" ON public.order_items
FOR UPDATE USING (
  auth.uid() IS NOT NULL AND 
  (user_id = auth.uid() OR public.is_admin(auth.uid()))
);

CREATE POLICY "Users can delete their own order items or admins can delete any" ON public.order_items
FOR DELETE USING (
  auth.uid() IS NOT NULL AND 
  (user_id = auth.uid() OR public.is_admin(auth.uid()))
);

-- 5. Secure database functions by adding search_path protection
CREATE OR REPLACE FUNCTION public.generate_sequence_number(prefix text, table_name text, user_id uuid)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
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

-- 6. Create audit logging function for security events
CREATE OR REPLACE FUNCTION public.log_security_event(
  p_user_id uuid,
  p_action text,
  p_resource_type text,
  p_resource_id uuid DEFAULT NULL,
  p_details jsonb DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
BEGIN
  INSERT INTO public.security_audit_log (
    user_id,
    action,
    resource_type,
    resource_id,
    details,
    ip_address,
    user_agent
  ) VALUES (
    p_user_id,
    p_action,
    p_resource_type,
    p_resource_id,
    p_details,
    COALESCE(current_setting('request.header.x-forwarded-for', true)::inet, '0.0.0.0'::inet),
    current_setting('request.header.user-agent', true)
  );
EXCEPTION
  WHEN OTHERS THEN
    -- Don't let audit failures block operations, but log the issue
    RAISE WARNING 'Failed to log security event: %', SQLERRM;
END;
$function$;

-- 7. Create company validation function
CREATE OR REPLACE FUNCTION public.validate_company_access(target_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
DECLARE
  current_user_company text;
  target_user_company text;
BEGIN
  -- Get current user's company
  SELECT raw_user_meta_data->>'company_id' INTO current_user_company
  FROM auth.users WHERE id = auth.uid();
  
  -- Get target user's company
  SELECT raw_user_meta_data->>'company_id' INTO target_user_company
  FROM auth.users WHERE id = target_user_id;
  
  -- Allow access if same company or if current user is admin
  RETURN (current_user_company = target_user_company) OR public.is_admin(auth.uid());
END;
$function$;

-- 8. Fix clients table RLS to be company-based
DROP POLICY IF EXISTS "Authenticated users can manage all clients" ON public.clients;

CREATE POLICY "Users can manage clients from their company" ON public.clients
FOR ALL USING (
  auth.uid() IS NOT NULL AND 
  public.validate_company_access(user_id)
);

-- 9. Fix products table RLS to be company-based  
DROP POLICY IF EXISTS "Authenticated users can manage all products" ON public.products;

CREATE POLICY "Users can manage products from their company" ON public.products
FOR ALL USING (
  auth.uid() IS NOT NULL AND 
  public.validate_company_access(user_id)
);

-- 10. Add security triggers for audit logging
CREATE OR REPLACE FUNCTION public.audit_orders_changes()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
BEGIN
  IF TG_OP = 'INSERT' THEN
    PERFORM public.log_security_event(
      NEW.user_id,
      'CREATE_ORDER',
      'orders',
      NEW.id,
      jsonb_build_object('order_number', NEW.order_number, 'total_amount', NEW.total_amount)
    );
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    PERFORM public.log_security_event(
      NEW.user_id,
      'UPDATE_ORDER',
      'orders',
      NEW.id,
      jsonb_build_object('old_status', OLD.status, 'new_status', NEW.status)
    );
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    PERFORM public.log_security_event(
      OLD.user_id,
      'DELETE_ORDER',
      'orders',
      OLD.id,
      jsonb_build_object('order_number', OLD.order_number)
    );
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$function$;

-- Create audit trigger for orders
DROP TRIGGER IF EXISTS audit_orders_trigger ON public.orders;
CREATE TRIGGER audit_orders_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.audit_orders_changes();