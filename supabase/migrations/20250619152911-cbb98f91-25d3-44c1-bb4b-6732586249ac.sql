
-- Inserir o módulo SaaS como módulo core na tabela saas_modules
INSERT INTO public.saas_modules (name, description, category, icon, route_path, is_core)
VALUES ('SaaS Management', 'Gestão completa do sistema SaaS - empresas, planos, módulos e assinaturas', 'System', 'Building2', '/saas', true)
ON CONFLICT (route_path) DO NOTHING;

-- Criar perfil master padrão para todas as empresas (se não existir)
INSERT INTO public.perfis (nome, empresa_id, descricao, is_admin)
SELECT 
  'Master',
  c.id,
  'Perfil master com acesso total ao sistema SaaS',
  true
FROM public.companies c
WHERE NOT EXISTS (
  SELECT 1 FROM public.perfis p 
  WHERE p.empresa_id = c.id AND p.nome = 'Master'
);

-- Migrar usuários existentes com role 'master' para o novo sistema
UPDATE public.profiles 
SET perfil_id = (
  SELECT p.id 
  FROM public.perfis p 
  INNER JOIN public.user_roles ur ON ur.company_id = p.empresa_id
  WHERE p.nome = 'Master' 
  AND ur.user_id = profiles.id 
  AND ur.role = 'master'
  LIMIT 1
)
WHERE perfil_id IS NULL 
AND id IN (
  SELECT ur.user_id 
  FROM public.user_roles ur 
  WHERE ur.role = 'master'
);

-- Migrar usuários existentes com role 'admin' para perfil admin
UPDATE public.profiles 
SET perfil_id = (
  SELECT p.id 
  FROM public.perfis p 
  WHERE p.empresa_id = profiles.company_id 
  AND p.is_admin = true 
  AND p.nome = 'Administrador'
  LIMIT 1
)
WHERE perfil_id IS NULL 
AND id IN (
  SELECT ur.user_id 
  FROM public.user_roles ur 
  WHERE ur.role = 'admin'
);
