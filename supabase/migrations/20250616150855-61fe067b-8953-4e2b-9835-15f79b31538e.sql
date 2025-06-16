
-- Criar função para buscar usuários de uma empresa específica
CREATE OR REPLACE FUNCTION public.get_company_users(company_id_param uuid)
RETURNS TABLE (
  id uuid,
  first_name text,
  last_name text,
  email text,
  role text
)
LANGUAGE sql
STABLE SECURITY DEFINER
AS $$
  SELECT 
    p.id,
    p.first_name,
    p.last_name,
    au.email,
    ur.role::text
  FROM public.profiles p
  INNER JOIN auth.users au ON p.id = au.id
  LEFT JOIN public.user_roles ur ON p.id = ur.user_id
  WHERE p.company_id = company_id_param
    AND p.is_active = true
  ORDER BY p.first_name, p.last_name;
$$;
