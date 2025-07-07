-- Reset completo do sistema de usuários contornando corrupção da API Admin

-- 1. Limpar tabelas relacionadas aos usuários
DELETE FROM public.user_module_permissions;
DELETE FROM public.user_roles;

-- 2. Limpar dados corrompidos da tabela auth.users (apenas se necessário)
-- Corrigir valores NULL na coluna email_change que estão causando o erro
UPDATE auth.users 
SET email_change = '' 
WHERE email_change IS NULL;

-- 3. Deletar todos os usuários existentes da tabela auth.users
DELETE FROM auth.users;

-- 4. Criar o usuário master diretamente na tabela auth.users
INSERT INTO auth.users (
  id,
  instance_id,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at,
  raw_app_meta_data,
  raw_user_meta_data,
  is_super_admin,
  role,
  email_change,
  phone_change,
  confirmation_token,
  recovery_token,
  email_change_token_new,
  email_change_token_current,
  phone_change_token
) VALUES (
  gen_random_uuid(),
  '00000000-0000-0000-0000-000000000000',
  'bapx@bapx.com.br',
  crypt('123456', gen_salt('bf')),
  now(),
  now(),
  now(),
  '{"provider": "email", "providers": ["email"]}',
  '{"first_name": "Master", "last_name": "BAPX"}',
  false,
  'authenticated',
  '',
  '',
  '',
  '',
  '',
  '',
  ''
);

-- 5. Obter o ID do usuário recém-criado e criar a role master
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'master'::user_type
FROM auth.users 
WHERE email = 'bapx@bapx.com.br';

-- 6. Dar todas as permissões de módulos para o usuário master
INSERT INTO public.user_module_permissions (user_id, module_id)
SELECT u.id, sm.id
FROM auth.users u
CROSS JOIN public.system_modules sm
WHERE u.email = 'bapx@bapx.com.br';