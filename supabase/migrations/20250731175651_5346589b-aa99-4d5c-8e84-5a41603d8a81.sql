-- Verificar se há problemas com search_path nas funções
-- Atualizar a função is_admin para garantir search_path correto
CREATE OR REPLACE FUNCTION public.is_admin(user_id uuid DEFAULT auth.uid())
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
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
$$;

-- Atualizar validate_company_access também
CREATE OR REPLACE FUNCTION public.validate_company_access(target_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
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
$$;