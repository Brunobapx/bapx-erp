
-- Passo 1: Verificar e configurar o usuário master
DO $$
DECLARE
  master_user_id UUID;
  bapx_company_id UUID;
  user_exists BOOLEAN := FALSE;
BEGIN
  -- Verificar se o usuário já existe
  SELECT id INTO master_user_id 
  FROM auth.users 
  WHERE email = 'bapx@bapx.com.br';
  
  IF master_user_id IS NOT NULL THEN
    user_exists := TRUE;
    RAISE NOTICE 'Usuário bapx@bapx.com.br já existe com ID: %', master_user_id;
  ELSE
    -- Criar o usuário se não existir
    INSERT INTO auth.users (
      id,
      instance_id,
      email,
      encrypted_password,
      email_confirmed_at,
      created_at,
      updated_at,
      role,
      aud,
      confirmation_token,
      email_change_token_new,
      recovery_token,
      raw_app_meta_data,
      raw_user_meta_data,
      is_super_admin
    ) VALUES (
      gen_random_uuid(),
      '00000000-0000-0000-0000-000000000000',
      'bapx@bapx.com.br',
      crypt('Bapx@2025', gen_salt('bf')),
      now(),
      now(),
      now(),
      'authenticated',
      'authenticated',
      '',
      '',
      '',
      '{"provider":"email","providers":["email"]}',
      '{"first_name":"BAPX","last_name":"Master"}',
      false
    ) RETURNING id INTO master_user_id;
    
    RAISE NOTICE 'Usuário bapx@bapx.com.br criado com ID: %', master_user_id;
  END IF;
  
  -- Buscar ou criar empresa BAPX
  SELECT id INTO bapx_company_id 
  FROM public.companies 
  WHERE subdomain = 'main' 
  LIMIT 1;
  
  IF bapx_company_id IS NULL THEN
    SELECT id INTO bapx_company_id FROM public.companies LIMIT 1;
    
    IF bapx_company_id IS NULL THEN
      INSERT INTO public.companies (id, name, subdomain, status)
      VALUES (gen_random_uuid(), 'BAPX ERP', 'main', 'active')
      RETURNING id INTO bapx_company_id;
      RAISE NOTICE 'Empresa BAPX ERP criada com ID: %', bapx_company_id;
    ELSE
      -- Atualizar empresa existente para BAPX
      UPDATE public.companies 
      SET name = 'BAPX ERP', subdomain = 'main', status = 'active'
      WHERE id = bapx_company_id;
      RAISE NOTICE 'Empresa existente atualizada para BAPX ERP com ID: %', bapx_company_id;
    END IF;
  ELSE
    RAISE NOTICE 'Empresa BAPX ERP já existe com ID: %', bapx_company_id;
  END IF;
  
  -- Verificar se perfil já existe
  IF EXISTS (SELECT 1 FROM public.profiles WHERE id = master_user_id) THEN
    -- Atualizar perfil existente
    UPDATE public.profiles 
    SET 
      company_id = bapx_company_id,
      first_name = 'BAPX',
      last_name = 'Master',
      is_active = true,
      updated_at = now()
    WHERE id = master_user_id;
    RAISE NOTICE 'Perfil do usuário master atualizado';
  ELSE
    -- Criar perfil do usuário master
    INSERT INTO public.profiles (
      id,
      company_id,
      first_name,
      last_name,
      is_active,
      created_at,
      updated_at
    ) VALUES (
      master_user_id,
      bapx_company_id,
      'BAPX',
      'Master',
      true,
      now(),
      now()
    );
    RAISE NOTICE 'Perfil do usuário master criado';
  END IF;
  
  -- Verificar se role já existe
  IF EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = master_user_id) THEN
    -- Atualizar role existente
    UPDATE public.user_roles 
    SET 
      role = 'master',
      company_id = bapx_company_id
    WHERE user_id = master_user_id;
    RAISE NOTICE 'Role do usuário master atualizada para master';
  ELSE
    -- Criar role master
    INSERT INTO public.user_roles (
      user_id,
      role,
      company_id,
      created_at
    ) VALUES (
      master_user_id,
      'master',
      bapx_company_id,
      now()
    );
    RAISE NOTICE 'Role master criada para o usuário';
  END IF;
  
  RAISE NOTICE 'Configuração do usuário master concluída com sucesso!';
END $$;

-- Passo 2: Verificar a configuração final
SELECT 
  u.id,
  u.email,
  p.first_name,
  p.last_name,
  ur.role,
  c.name as company_name,
  c.subdomain
FROM auth.users u
JOIN public.profiles p ON u.id = p.id
JOIN public.user_roles ur ON u.id = ur.user_id
JOIN public.companies c ON p.company_id = c.id
WHERE u.email = 'bapx@bapx.com.br';
