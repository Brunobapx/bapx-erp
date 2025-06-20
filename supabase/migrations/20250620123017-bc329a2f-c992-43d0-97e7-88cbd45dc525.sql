
-- Primeiro, remover todas as referências de foreign key
UPDATE public.profiles SET perfil_id = NULL;

-- Depois remover dados relacionados ao SaaS
DELETE FROM public.permissoes;
DELETE FROM public.perfis;
DELETE FROM public.company_subscriptions;
DELETE FROM public.company_modules;
DELETE FROM public.saas_plan_modules;
DELETE FROM public.saas_analytics;
DELETE FROM public.user_role_permissions;

-- Definir uma empresa padrão para o sistema single-tenant
UPDATE public.companies SET 
  name = 'BAPX ERP',
  subdomain = 'main',
  is_active = true,
  status = 'active'
WHERE id = (SELECT company_id FROM public.profiles WHERE id = (SELECT id FROM auth.users WHERE email = 'bruno@bapx.com.br' LIMIT 1) LIMIT 1);

-- Garantir que Bruno seja master
UPDATE public.user_roles 
SET role = 'master' 
WHERE user_id = (SELECT id FROM auth.users WHERE email = 'bruno@bapx.com.br' LIMIT 1);

-- Remover coluna perfil_id da tabela profiles primeiro
ALTER TABLE public.profiles DROP COLUMN IF EXISTS perfil_id;

-- Agora remover tabelas SaaS que não são mais necessárias
DROP TABLE IF EXISTS public.permissoes CASCADE;
DROP TABLE IF EXISTS public.perfis CASCADE;
DROP TABLE IF EXISTS public.company_subscriptions CASCADE;
DROP TABLE IF EXISTS public.company_modules CASCADE;
DROP TABLE IF EXISTS public.saas_plan_modules CASCADE;
DROP TABLE IF EXISTS public.saas_plans CASCADE;
DROP TABLE IF EXISTS public.saas_modules CASCADE;
DROP TABLE IF EXISTS public.saas_analytics CASCADE;
DROP TABLE IF EXISTS public.user_role_permissions CASCADE;
DROP TABLE IF EXISTS public.activity_logs CASCADE;

-- Remover colunas SaaS das tabelas companies
ALTER TABLE public.companies 
DROP COLUMN IF EXISTS plano_id,
DROP COLUMN IF EXISTS vencimento,
DROP COLUMN IF EXISTS max_usuarios,
DROP COLUMN IF EXISTS cnpj,
DROP COLUMN IF EXISTS whatsapp;

-- Remover funções SaaS
DROP FUNCTION IF EXISTS public.user_has_permission(uuid, text, text);
DROP FUNCTION IF EXISTS public.company_has_module_access(uuid, text);
DROP FUNCTION IF EXISTS public.role_has_module_access(app_role, text);
DROP FUNCTION IF EXISTS public.company_is_active(uuid);
DROP FUNCTION IF EXISTS public.delete_company_and_related(uuid);

-- Simplificar sistema de permissões para usar apenas user_roles
CREATE OR REPLACE FUNCTION public.user_is_master(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = 'master'
  )
$$;

CREATE OR REPLACE FUNCTION public.user_is_admin(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role IN ('master', 'admin')
  )
$$;
