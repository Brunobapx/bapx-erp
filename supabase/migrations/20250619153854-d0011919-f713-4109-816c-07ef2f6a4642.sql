
-- Corrigir o perfil do usuário Bruno para Master
UPDATE public.profiles 
SET perfil_id = (
  SELECT p.id 
  FROM public.perfis p 
  WHERE p.empresa_id = profiles.company_id 
  AND p.nome = 'Master'
  LIMIT 1
)
WHERE id IN (
  SELECT id FROM auth.users WHERE email = 'bruno@bapx.com.br'
);

-- Criar constraint única correta na tabela user_roles para evitar conflitos
ALTER TABLE public.user_roles 
DROP CONSTRAINT IF EXISTS user_roles_user_id_company_id_key;

ALTER TABLE public.user_roles 
ADD CONSTRAINT user_roles_user_id_company_id_key 
UNIQUE (user_id, company_id);
