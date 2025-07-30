-- Criar função para buscar técnicos
CREATE OR REPLACE FUNCTION public.get_technicians()
 RETURNS TABLE(
   id uuid,
   first_name text,
   last_name text,
   email text
 )
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = ''
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    au.id,
    au.raw_user_meta_data ->> 'first_name' as first_name,
    au.raw_user_meta_data ->> 'last_name' as last_name,
    au.email
  FROM auth.users au
  INNER JOIN public.user_positions up ON au.id = up.user_id
  WHERE up.position = 'tecnico'
    AND au.deleted_at IS NULL;
END;
$$;