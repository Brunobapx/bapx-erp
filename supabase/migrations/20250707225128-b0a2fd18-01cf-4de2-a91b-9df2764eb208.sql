-- Corrigir problemas de login: confirmar emails e adicionar roles
-- Confirmar emails dos usuários existentes (apenas email_confirmed_at)
UPDATE auth.users 
SET email_confirmed_at = now()
WHERE email_confirmed_at IS NULL;

-- Adicionar role master para bruno@bapx.com.br se existir
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'master'
FROM auth.users 
WHERE email = 'bruno@bapx.com.br'
ON CONFLICT (user_id) DO UPDATE SET role = 'master';

-- Adicionar role admin para bapx@bapx.com.br se existir
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'admin'
FROM auth.users 
WHERE email = 'bapx@bapx.com.br'
ON CONFLICT (user_id) DO UPDATE SET role = 'admin';

-- Confirmar que admin@teste.com já tem role admin
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'admin'
FROM auth.users 
WHERE email = 'admin@teste.com'
ON CONFLICT (user_id) DO NOTHING;