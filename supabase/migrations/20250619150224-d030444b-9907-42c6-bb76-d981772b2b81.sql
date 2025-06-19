
-- Primeiro, vamos criar as tabelas principais para o sistema SaaS

-- Tabela de perfis/roles por empresa
CREATE TABLE IF NOT EXISTS public.perfis (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  empresa_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  descricao TEXT,
  is_admin BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Tabela de permissões específicas por perfil e módulo
CREATE TABLE IF NOT EXISTS public.permissoes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  perfil_id UUID NOT NULL REFERENCES public.perfis(id) ON DELETE CASCADE,
  module_id UUID NOT NULL REFERENCES public.saas_modules(id) ON DELETE CASCADE,
  pode_ver BOOLEAN DEFAULT true,
  pode_editar BOOLEAN DEFAULT false,
  pode_excluir BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(perfil_id, module_id)
);

-- Atualizar tabela de profiles para incluir perfil_id
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS perfil_id UUID REFERENCES public.perfis(id);

-- Atualizar tabela companies para incluir campos importantes
ALTER TABLE public.companies 
ADD COLUMN IF NOT EXISTS cnpj TEXT,
ADD COLUMN IF NOT EXISTS plano_id UUID REFERENCES public.saas_plans(id),
ADD COLUMN IF NOT EXISTS vencimento DATE,
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active',
ADD COLUMN IF NOT EXISTS max_usuarios INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS whatsapp TEXT;

-- Atualizar saas_plans para incluir qtd_max_usuarios
ALTER TABLE public.saas_plans 
ADD COLUMN IF NOT EXISTS qtd_max_usuarios INTEGER DEFAULT 1;

-- Criar tabela de logs de atividades
CREATE TABLE IF NOT EXISTS public.activity_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  empresa_id UUID NOT NULL REFERENCES public.companies(id),
  action TEXT NOT NULL,
  module_name TEXT NOT NULL,
  description TEXT,
  ip_address INET,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Criar função para verificar permissões específicas
CREATE OR REPLACE FUNCTION public.user_has_permission(
  _user_id UUID,
  _module_route TEXT,
  _permission_type TEXT DEFAULT 'pode_ver'
) RETURNS BOOLEAN
LANGUAGE SQL
STABLE SECURITY DEFINER
AS $$
  WITH user_profile AS (
    SELECT p.perfil_id, p.company_id
    FROM public.profiles p
    WHERE p.id = _user_id
    LIMIT 1
  ),
  module_info AS (
    SELECT id FROM public.saas_modules 
    WHERE route_path = _module_route
    LIMIT 1
  ),
  user_permission AS (
    SELECT 
      CASE 
        WHEN _permission_type = 'pode_ver' THEN perm.pode_ver
        WHEN _permission_type = 'pode_editar' THEN perm.pode_editar
        WHEN _permission_type = 'pode_excluir' THEN perm.pode_excluir
        ELSE false
      END as has_permission
    FROM public.permissoes perm
    INNER JOIN user_profile up ON perm.perfil_id = up.perfil_id
    INNER JOIN module_info mi ON perm.module_id = mi.id
  )
  SELECT COALESCE(
    (SELECT has_permission FROM user_permission),
    -- Se não tem permissão específica, verificar se é admin
    (SELECT EXISTS(
      SELECT 1 FROM public.perfis pr
      INNER JOIN user_profile up ON pr.id = up.perfil_id
      WHERE pr.is_admin = true
    )),
    false
  );
$$;

-- Criar função para obter empresa do usuário
CREATE OR REPLACE FUNCTION public.get_user_company()
RETURNS UUID
LANGUAGE SQL
STABLE SECURITY DEFINER
AS $$
  SELECT company_id FROM public.profiles WHERE id = auth.uid() LIMIT 1;
$$;

-- Criar função para verificar se empresa está ativa
CREATE OR REPLACE FUNCTION public.company_is_active(_company_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE SECURITY DEFINER
AS $$
  SELECT 
    status = 'active' AND 
    (vencimento IS NULL OR vencimento >= CURRENT_DATE)
  FROM public.companies 
  WHERE id = _company_id;
$$;

-- Habilitar RLS nas novas tabelas
ALTER TABLE public.perfis ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.permissoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para perfis
CREATE POLICY "Users can view perfis from their company" ON public.perfis
  FOR SELECT USING (empresa_id = get_user_company());

CREATE POLICY "Admins can manage perfis from their company" ON public.perfis
  FOR ALL USING (
    empresa_id = get_user_company() AND
    user_has_permission(auth.uid(), '/configuracoes', 'pode_editar')
  );

-- Políticas RLS para permissões
CREATE POLICY "Users can view permissoes from their company" ON public.permissoes
  FOR SELECT USING (
    EXISTS(
      SELECT 1 FROM public.perfis p 
      WHERE p.id = perfil_id AND p.empresa_id = get_user_company()
    )
  );

CREATE POLICY "Admins can manage permissoes from their company" ON public.permissoes
  FOR ALL USING (
    EXISTS(
      SELECT 1 FROM public.perfis p 
      WHERE p.id = perfil_id AND p.empresa_id = get_user_company()
    ) AND
    user_has_permission(auth.uid(), '/configuracoes', 'pode_editar')
  );

-- Políticas RLS para activity_logs
CREATE POLICY "Users can view activity_logs from their company" ON public.activity_logs
  FOR SELECT USING (empresa_id = get_user_company());

CREATE POLICY "System can insert activity_logs" ON public.activity_logs
  FOR INSERT WITH CHECK (empresa_id = get_user_company());

-- Inserir perfis padrão para empresas existentes
INSERT INTO public.perfis (nome, empresa_id, descricao, is_admin)
SELECT 
  'Administrador',
  c.id,
  'Perfil administrativo com acesso total',
  true
FROM public.companies c
WHERE NOT EXISTS (
  SELECT 1 FROM public.perfis p WHERE p.empresa_id = c.id AND p.is_admin = true
);

-- Associar usuários existentes ao perfil admin de suas empresas
UPDATE public.profiles 
SET perfil_id = (
  SELECT p.id 
  FROM public.perfis p 
  WHERE p.empresa_id = profiles.company_id 
  AND p.is_admin = true 
  LIMIT 1
)
WHERE perfil_id IS NULL AND company_id IS NOT NULL;
