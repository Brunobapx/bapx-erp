
-- Tabela para mapear quais módulos cada perfil (role) pode acessar
CREATE TABLE public.user_role_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  role app_role NOT NULL,
  module_id UUID NOT NULL REFERENCES saas_modules(id),
  can_access BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(role, module_id)
);

-- RLS: Somente masters podem gerenciar permissões das roles
ALTER TABLE public.user_role_permissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Masters podem gerenciar permissões dos perfis"
  ON public.user_role_permissions
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'master'))
  WITH CHECK (public.has_role(auth.uid(), 'master'));

CREATE POLICY "Todos podem consultar permissões dos perfis"
  ON public.user_role_permissions
  FOR SELECT TO authenticated
  USING (true);

-- Função para verificar se uma role tem acesso a um módulo
CREATE OR REPLACE FUNCTION public.role_has_module_access(role_param app_role, module_route TEXT)
RETURNS BOOLEAN
LANGUAGE sql
STABLE SECURITY DEFINER
AS $$
  WITH module_info AS (
    SELECT id, is_core FROM public.saas_modules WHERE route_path = module_route
  ),
  permission AS (
    SELECT can_access FROM public.user_role_permissions urp
    INNER JOIN module_info mi ON urp.module_id = mi.id
    WHERE urp.role = role_param
    LIMIT 1
  )
  SELECT
    -- Módulos core sempre disponíveis
    CASE WHEN mi.is_core THEN true
         WHEN permission.can_access IS NOT NULL THEN permission.can_access
         ELSE false
    END
  FROM module_info mi
  LEFT JOIN permission ON true;
$$;

-- Registros padrão: permitir acesso completo aos masters em todos os módulos
INSERT INTO public.user_role_permissions (role, module_id, can_access)
SELECT 'master', id, true FROM public.saas_modules;

-- Permissões padrão: admins podem acessar todos os módulos
INSERT INTO public.user_role_permissions (role, module_id, can_access)
SELECT 'admin', id, true FROM public.saas_modules;

-- Exemplo de regras para outros papéis
-- (adicione mais inserts ou ajuste conforme sua lógica de negócio desejada)
