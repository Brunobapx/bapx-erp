-- Corrigir a função get_technicians para retornar o tipo correto
DROP FUNCTION IF EXISTS public.get_technicians();

CREATE OR REPLACE FUNCTION public.get_technicians()
 RETURNS TABLE(id uuid, first_name text, last_name text, email text)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
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
$function$