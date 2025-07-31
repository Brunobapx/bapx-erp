-- Fix the remaining 2 functions to include SET search_path = '' for security

-- 1. Fix is_seller function
CREATE OR REPLACE FUNCTION public.is_seller(user_id uuid DEFAULT auth.uid())
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
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

-- 2. Fix is_admin function
CREATE OR REPLACE FUNCTION public.is_admin(user_id uuid DEFAULT auth.uid())
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
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