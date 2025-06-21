
-- Criar tabela de módulos do sistema
CREATE TABLE IF NOT EXISTS public.system_modules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  route_path TEXT NOT NULL UNIQUE,
  description TEXT,
  category TEXT NOT NULL,
  icon TEXT,
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Criar tabela de perfis de acesso
CREATE TABLE IF NOT EXISTS public.access_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  is_admin BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(company_id, name)
);

-- Criar tabela de relacionamento entre perfis e módulos
CREATE TABLE IF NOT EXISTS public.profile_modules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES public.access_profiles(id) ON DELETE CASCADE,
  module_id UUID NOT NULL REFERENCES public.system_modules(id) ON DELETE CASCADE,
  can_view BOOLEAN DEFAULT true,
  can_edit BOOLEAN DEFAULT false,
  can_delete BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(profile_id, module_id)
);

-- Adicionar coluna profile_id na tabela profiles (usuários)
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS profile_id UUID REFERENCES public.access_profiles(id);

-- Inserir módulos do sistema
INSERT INTO public.system_modules (name, route_path, description, category, icon, sort_order) VALUES
('Dashboard', '/', 'Painel principal com visão geral', 'Principal', 'ChartBar', 1),
('Clientes', '/clientes', 'Gestão de clientes', 'Vendas', 'User', 2),
('Produtos', '/produtos', 'Gestão de produtos e estoque', 'Produtos', 'Package', 3),
('Fornecedores', '/fornecedores', 'Gestão de fornecedores', 'Compras', 'Users', 4),
('Compras', '/compras', 'Gestão de compras', 'Compras', 'ShoppingCart', 5),
('Estoque', '/estoque', 'Controle de estoque', 'Produtos', 'Warehouse', 6),
('Pedidos', '/pedidos', 'Gestão de pedidos', 'Vendas', 'Package', 7),
('Produção', '/producao', 'Controle de produção', 'Produção', 'Box', 8),
('Embalagem', '/embalagem', 'Controle de embalagem', 'Produção', 'Box', 9),
('Vendas', '/vendas', 'Gestão de vendas', 'Vendas', 'DollarSign', 10),
('Emissão Fiscal', '/emissao-fiscal', 'Emissão de notas fiscais', 'Fiscal', 'FilePen', 11),
('Financeiro', '/financeiro', 'Gestão financeira', 'Financeiro', 'DollarSign', 12),
('Roteirização', '/rotas', 'Gestão de rotas de entrega', 'Logística', 'Truck', 13),
('Calendário', '/calendario', 'Calendário de eventos', 'Ferramentas', 'Calendar', 14),
('Ordens de Serviço', '/ordens-servico', 'Gestão de ordens de serviço', 'Serviços', 'FilePen', 15),
('Configurações', '/configuracoes', 'Configurações do sistema', 'Sistema', 'Settings', 16)
ON CONFLICT (route_path) DO NOTHING;

-- Criar perfis padrão para empresas existentes
INSERT INTO public.access_profiles (company_id, name, description, is_admin)
SELECT 
  c.id,
  'Master',
  'Perfil master com acesso total ao sistema',
  true
FROM public.companies c
WHERE NOT EXISTS (
  SELECT 1 FROM public.access_profiles ap 
  WHERE ap.company_id = c.id AND ap.name = 'Master'
);

INSERT INTO public.access_profiles (company_id, name, description, is_admin)
SELECT 
  c.id,
  'Administrador',
  'Perfil administrativo com acesso completo',
  true
FROM public.companies c
WHERE NOT EXISTS (
  SELECT 1 FROM public.access_profiles ap 
  WHERE ap.company_id = c.id AND ap.name = 'Administrador'
);

INSERT INTO public.access_profiles (company_id, name, description, is_admin)
SELECT 
  c.id,
  'Vendedor',
  'Perfil para equipe de vendas',
  false
FROM public.companies c
WHERE NOT EXISTS (
  SELECT 1 FROM public.access_profiles ap 
  WHERE ap.company_id = c.id AND ap.name = 'Vendedor'
);

INSERT INTO public.access_profiles (company_id, name, description, is_admin)
SELECT 
  c.id,
  'Financeiro',
  'Perfil para equipe financeira',
  false
FROM public.companies c
WHERE NOT EXISTS (
  SELECT 1 FROM public.access_profiles ap 
  WHERE ap.company_id = c.id AND ap.name = 'Financeiro'
);

-- Dar acesso total aos perfis Master e Administrador
INSERT INTO public.profile_modules (profile_id, module_id, can_view, can_edit, can_delete)
SELECT 
  ap.id,
  sm.id,
  true,
  true,
  true
FROM public.access_profiles ap
CROSS JOIN public.system_modules sm
WHERE ap.name IN ('Master', 'Administrador')
ON CONFLICT (profile_id, module_id) DO NOTHING;

-- Dar acesso limitado ao perfil Vendedor
INSERT INTO public.profile_modules (profile_id, module_id, can_view, can_edit, can_delete)
SELECT 
  ap.id,
  sm.id,
  true,
  CASE WHEN sm.route_path IN ('/', '/clientes', '/produtos', '/pedidos', '/vendas') THEN true ELSE false END,
  false
FROM public.access_profiles ap
CROSS JOIN public.system_modules sm
WHERE ap.name = 'Vendedor'
  AND sm.route_path IN ('/', '/clientes', '/produtos', '/pedidos', '/vendas', '/calendario')
ON CONFLICT (profile_id, module_id) DO NOTHING;

-- Dar acesso limitado ao perfil Financeiro
INSERT INTO public.profile_modules (profile_id, module_id, can_view, can_edit, can_delete)
SELECT 
  ap.id,
  sm.id,
  true,
  CASE WHEN sm.route_path IN ('/', '/financeiro', '/vendas') THEN true ELSE false END,
  false
FROM public.access_profiles ap
CROSS JOIN public.system_modules sm
WHERE ap.name = 'Financeiro'
  AND sm.route_path IN ('/', '/clientes', '/vendas', '/financeiro', '/calendario')
ON CONFLICT (profile_id, module_id) DO NOTHING;

-- Associar usuários existentes aos perfis baseado em suas roles (corrigido para usar apenas valores válidos)
UPDATE public.profiles 
SET profile_id = (
  SELECT ap.id 
  FROM public.access_profiles ap 
  INNER JOIN public.user_roles ur ON ur.company_id = ap.company_id
  WHERE ap.company_id = profiles.company_id 
    AND ur.user_id = profiles.id
    AND CASE 
      WHEN ur.role = 'master' THEN ap.name = 'Master'
      WHEN ur.role = 'admin' THEN ap.name = 'Administrador'
      ELSE ap.name = 'Vendedor'
    END
  LIMIT 1
)
WHERE profile_id IS NULL;

-- Habilitar RLS nas novas tabelas
ALTER TABLE public.system_modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.access_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profile_modules ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para system_modules (público para leitura)
CREATE POLICY "Anyone can view system modules" ON public.system_modules
  FOR SELECT USING (true);

-- Políticas RLS para access_profiles
CREATE POLICY "Users can view profiles from their company" ON public.access_profiles
  FOR SELECT USING (company_id = get_current_user_company_id());

CREATE POLICY "Admins can manage profiles from their company" ON public.access_profiles
  FOR ALL USING (
    company_id = get_current_user_company_id() AND
    user_is_admin(auth.uid())
  );

-- Políticas RLS para profile_modules
CREATE POLICY "Users can view profile modules from their company" ON public.profile_modules
  FOR SELECT USING (
    EXISTS(
      SELECT 1 FROM public.access_profiles ap 
      WHERE ap.id = profile_id AND ap.company_id = get_current_user_company_id()
    )
  );

CREATE POLICY "Admins can manage profile modules from their company" ON public.profile_modules
  FOR ALL USING (
    EXISTS(
      SELECT 1 FROM public.access_profiles ap 
      WHERE ap.id = profile_id AND ap.company_id = get_current_user_company_id()
    ) AND
    user_is_admin(auth.uid())
  );

-- Função para verificar se usuário tem acesso a um módulo
CREATE OR REPLACE FUNCTION public.user_has_module_access(_user_id UUID, _route_path TEXT)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles p
    INNER JOIN public.access_profiles ap ON p.profile_id = ap.id
    INNER JOIN public.profile_modules pm ON ap.id = pm.profile_id
    INNER JOIN public.system_modules sm ON pm.module_id = sm.id
    WHERE p.id = _user_id
      AND sm.route_path = _route_path
      AND pm.can_view = true
      AND ap.is_active = true
      AND sm.is_active = true
  ) OR user_is_admin(_user_id);
$$;
