-- Criar usuário de teste admin
INSERT INTO public.user_roles (user_id, role)
VALUES 
  -- Para o usuário bapx@bapx.com.br que já existe
  ((SELECT id FROM auth.users WHERE email = 'bapx@bapx.com.br' LIMIT 1), 'master')
ON CONFLICT (user_id, role) DO NOTHING;

-- Verificar se existe algum usuário admin/master
SELECT 
  au.email,
  ur.role,
  au.email_confirmed_at
FROM auth.users au
LEFT JOIN public.user_roles ur ON au.id = ur.user_id
WHERE ur.role IN ('admin', 'master')
   OR au.email = 'bapx@bapx.com.br';