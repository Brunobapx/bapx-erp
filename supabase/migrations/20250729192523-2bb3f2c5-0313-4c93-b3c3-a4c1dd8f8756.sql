-- CRITICAL SECURITY FIXES

-- 1. Fix Critical Role Management Vulnerability
-- Remove dangerous policy that allows users to assign themselves any role
DROP POLICY IF EXISTS "Users can insert their own role" ON public.user_roles;

-- Create secure admin-only role assignment policy
CREATE POLICY "Only admins can insert user roles" 
ON public.user_roles 
FOR INSERT 
USING (public.is_admin(auth.uid()));

CREATE POLICY "Only admins can update user roles" 
ON public.user_roles 
FOR UPDATE 
USING (public.is_admin(auth.uid()));

CREATE POLICY "Only admins can delete user roles" 
ON public.user_roles 
FOR DELETE 
USING (public.is_admin(auth.uid()));

-- Users can only view their own role
CREATE POLICY "Users can view their own role" 
ON public.user_roles 
FOR SELECT 
USING (auth.uid() = user_id OR public.is_admin(auth.uid()));

-- 2. Secure Database Functions - Add search_path protection
CREATE OR REPLACE FUNCTION public.update_fiscal_invoices_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER SET search_path = ''
AS $function$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER SET search_path = ''
AS $function$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.update_nota_configuracoes_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER SET search_path = ''
AS $function$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.update_notas_emitidas_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER SET search_path = ''
AS $function$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.has_module_permission(user_id uuid, module_route text)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER SET search_path = ''
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

CREATE OR REPLACE FUNCTION public.update_seller_commissions_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER SET search_path = ''
AS $function$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.set_commission_payment_number()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER SET search_path = ''
AS $function$
BEGIN
  IF NEW.payment_number IS NULL OR NEW.payment_number = '' THEN
    NEW.payment_number := public.generate_sequence_number('COM', 'commission_payments', NEW.user_id);
  END IF;
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.set_troca_number()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER SET search_path = ''
AS $function$
BEGIN
  IF NEW.numero_troca IS NULL OR NEW.numero_troca = '' THEN
    NEW.numero_troca := public.generate_sequence_number('TRC', 'trocas', NEW.user_id);
  END IF;
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.update_backup_history_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER SET search_path = ''
AS $function$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.is_seller(user_id uuid DEFAULT auth.uid())
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER SET search_path = ''
AS $function$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.user_positions 
    WHERE user_positions.user_id = COALESCE($1, auth.uid()) 
    AND position = 'vendedor'
  );
EXCEPTION
  WHEN OTHERS THEN
    RETURN FALSE;
END;
$function$;

CREATE OR REPLACE FUNCTION public.is_admin(user_id uuid DEFAULT auth.uid())
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER SET search_path = ''
AS $function$
BEGIN
  -- Verificação simples sem causar recursão
  RETURN EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_roles.user_id = COALESCE($1, auth.uid()) 
    AND role IN ('admin', 'master')
  );
EXCEPTION
  WHEN OTHERS THEN
    RETURN FALSE;
END;
$function$;

CREATE OR REPLACE FUNCTION public.set_order_number()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER SET search_path = ''
AS $function$
BEGIN
  IF NEW.order_number IS NULL OR NEW.order_number = '' THEN
    NEW.order_number := public.generate_sequence_number('PED', 'orders', NEW.user_id);
  END IF;
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.set_production_number()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER SET search_path = ''
AS $function$
BEGIN
  IF NEW.production_number IS NULL OR NEW.production_number = '' THEN
    NEW.production_number := public.generate_sequence_number('PR', 'production', NEW.user_id);
  END IF;
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.set_sale_number()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER SET search_path = ''
AS $function$
BEGIN
  IF NEW.sale_number IS NULL OR NEW.sale_number = '' THEN
    NEW.sale_number := public.generate_sequence_number('V', 'sales', NEW.user_id);
  END IF;
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.set_entry_number()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER SET search_path = ''
AS $function$
BEGIN
  IF NEW.entry_number IS NULL OR NEW.entry_number = '' THEN
    NEW.entry_number := public.generate_sequence_number('F', 'financial_entries', NEW.user_id);
  END IF;
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.set_route_number()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER SET search_path = ''
AS $function$
BEGIN
  IF NEW.route_number IS NULL OR NEW.route_number = '' THEN
    NEW.route_number := public.generate_sequence_number('RT', 'delivery_routes', NEW.user_id);
  END IF;
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.set_packaging_number()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER SET search_path = ''
AS $function$
BEGIN
  IF NEW.packaging_number IS NULL OR NEW.packaging_number = '' THEN
    NEW.packaging_number := public.generate_sequence_number('EMB', 'packaging', NEW.user_id);
  END IF;
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.generate_sequence_number(prefix text, table_name text, user_id uuid)
 RETURNS text
 LANGUAGE plpgsql
 SECURITY DEFINER SET search_path = ''
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

-- 3. Secure user_module_permissions table
CREATE POLICY "Only admins can manage user module permissions" 
ON public.user_module_permissions 
FOR ALL 
USING (public.is_admin(auth.uid()));

CREATE POLICY "Users can view their own module permissions" 
ON public.user_module_permissions 
FOR SELECT 
USING (auth.uid() = user_id OR public.is_admin(auth.uid()));

-- 4. Add audit logging table for security monitoring
CREATE TABLE IF NOT EXISTS public.security_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  action TEXT NOT NULL,
  resource_type TEXT NOT NULL,
  resource_id UUID,
  details JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on audit log
ALTER TABLE public.security_audit_log ENABLE ROW LEVEL SECURITY;

-- Only admins can view audit logs
CREATE POLICY "Only admins can view audit logs" 
ON public.security_audit_log 
FOR SELECT 
USING (public.is_admin(auth.uid()));

-- System can insert audit logs
CREATE POLICY "System can insert audit logs" 
ON public.security_audit_log 
FOR INSERT 
WITH CHECK (true);

-- Create function to log security events
CREATE OR REPLACE FUNCTION public.log_security_event(
  p_user_id UUID,
  p_action TEXT,
  p_resource_type TEXT,
  p_resource_id UUID DEFAULT NULL,
  p_details JSONB DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $function$
BEGIN
  INSERT INTO public.security_audit_log (
    user_id,
    action,
    resource_type,
    resource_id,
    details
  ) VALUES (
    p_user_id,
    p_action,
    p_resource_type,
    p_resource_id,
    p_details
  );
END;
$function$;