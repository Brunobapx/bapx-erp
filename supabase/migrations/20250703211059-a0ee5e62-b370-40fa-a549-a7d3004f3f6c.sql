-- Criar função para inserir usuário completo
CREATE OR REPLACE FUNCTION public.create_user_with_profile(
  user_email TEXT,
  user_password TEXT,
  first_name TEXT,
  last_name TEXT,
  user_role app_role DEFAULT 'user',
  profile_id UUID DEFAULT NULL,
  user_department TEXT DEFAULT NULL,
  user_position TEXT DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  new_user_id UUID;
  current_company_id UUID;
  result JSON;
BEGIN
  -- Buscar company_id do usuário atual
  SELECT company_id INTO current_company_id 
  FROM public.profiles 
  WHERE id = auth.uid() 
  LIMIT 1;
  
  IF current_company_id IS NULL THEN
    RETURN json_build_object('error', 'Company ID não encontrado');
  END IF;
  
  -- Verificar se o usuário atual é admin/master
  IF NOT (user_is_admin(auth.uid()) OR user_is_master(auth.uid())) THEN
    RETURN json_build_object('error', 'Permissão negada');
  END IF;
  
  -- Validar email único
  IF EXISTS (SELECT 1 FROM auth.users WHERE email = user_email) THEN
    RETURN json_build_object('error', 'Email já cadastrado');
  END IF;
  
  -- Criar usuário no auth (simulado - será feito no frontend)
  new_user_id := gen_random_uuid();
  
  -- Criar perfil
  INSERT INTO public.profiles (
    id, 
    first_name, 
    last_name, 
    company_id, 
    profile_id,
    department,
    position,
    is_active
  ) VALUES (
    new_user_id,
    first_name,
    last_name,
    current_company_id,
    profile_id,
    user_department,
    user_position,
    true
  );
  
  -- Criar role
  INSERT INTO public.user_roles (
    user_id,
    role,
    company_id
  ) VALUES (
    new_user_id,
    user_role,
    current_company_id
  );
  
  RETURN json_build_object(
    'success', true,
    'user_id', new_user_id,
    'company_id', current_company_id
  );
  
EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object('error', SQLERRM);
END;
$$;

-- Função para limpar dados inconsistentes
CREATE OR REPLACE FUNCTION public.cleanup_user_data()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  cleanup_count INTEGER := 0;
BEGIN
  -- Verificar se o usuário é master
  IF NOT user_is_master(auth.uid()) THEN
    RETURN 'Permissão negada';
  END IF;
  
  -- Remover profiles órfãos (sem usuário correspondente no auth)
  DELETE FROM public.profiles 
  WHERE id NOT IN (
    SELECT id FROM auth.users
  );
  
  GET DIAGNOSTICS cleanup_count = ROW_COUNT;
  
  RETURN format('Limpeza concluída. %s registros removidos.', cleanup_count);
END;
$$;