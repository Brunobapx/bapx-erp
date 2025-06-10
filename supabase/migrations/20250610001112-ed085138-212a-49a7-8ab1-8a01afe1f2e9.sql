
-- Criar tabela de planos SaaS
CREATE TABLE public.saas_plans (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  price NUMERIC NOT NULL DEFAULT 0,
  billing_cycle TEXT NOT NULL DEFAULT 'monthly', -- monthly, yearly
  max_users INTEGER DEFAULT NULL, -- NULL = unlimited
  features JSONB DEFAULT '[]'::jsonb,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Criar tabela de módulos do sistema
CREATE TABLE public.saas_modules (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL, -- core, production, sales, finance, etc
  icon TEXT,
  route_path TEXT,
  is_core BOOLEAN DEFAULT false, -- módulos core sempre habilitados
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Criar tabela de relação planos -> módulos
CREATE TABLE public.saas_plan_modules (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  plan_id UUID REFERENCES public.saas_plans(id) ON DELETE CASCADE,
  module_id UUID REFERENCES public.saas_modules(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(plan_id, module_id)
);

-- Criar tabela de assinaturas das empresas
CREATE TABLE public.company_subscriptions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
  plan_id UUID REFERENCES public.saas_plans(id),
  status TEXT NOT NULL DEFAULT 'active', -- active, suspended, cancelled
  starts_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE,
  auto_renew BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Criar tabela de módulos habilitados por empresa (override do plano)
CREATE TABLE public.company_modules (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
  module_id UUID REFERENCES public.saas_modules(id) ON DELETE CASCADE,
  enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(company_id, module_id)
);

-- Criar tabela de analytics/métricas
CREATE TABLE public.saas_analytics (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
  module_name TEXT NOT NULL,
  action TEXT NOT NULL, -- login, page_view, feature_use
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Atualizar tabela companies para incluir campos SaaS
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS onboarded_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS trial_expires_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS billing_email TEXT;

-- Enable RLS em todas as novas tabelas
ALTER TABLE public.saas_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.saas_modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.saas_plan_modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.company_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.company_modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.saas_analytics ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para saas_plans (apenas masters podem ver/editar)
CREATE POLICY "Masters can manage saas_plans" ON public.saas_plans
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'master'))
  WITH CHECK (public.has_role(auth.uid(), 'master'));

-- Políticas RLS para saas_modules (apenas masters podem ver/editar)
CREATE POLICY "Masters can manage saas_modules" ON public.saas_modules
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'master'))
  WITH CHECK (public.has_role(auth.uid(), 'master'));

-- Políticas RLS para saas_plan_modules (apenas masters podem ver/editar)
CREATE POLICY "Masters can manage saas_plan_modules" ON public.saas_plan_modules
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'master'))
  WITH CHECK (public.has_role(auth.uid(), 'master'));

-- Políticas RLS para company_subscriptions
CREATE POLICY "Masters can manage all subscriptions" ON public.company_subscriptions
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'master'))
  WITH CHECK (public.has_role(auth.uid(), 'master'));

CREATE POLICY "Admins can view own company subscription" ON public.company_subscriptions
  FOR SELECT TO authenticated
  USING (company_id = public.get_current_user_company_id() AND public.has_role(auth.uid(), 'admin'));

-- Políticas RLS para company_modules
CREATE POLICY "Masters can manage all company modules" ON public.company_modules
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'master'))
  WITH CHECK (public.has_role(auth.uid(), 'master'));

CREATE POLICY "Users can view own company modules" ON public.company_modules
  FOR SELECT TO authenticated
  USING (company_id = public.get_current_user_company_id());

-- Políticas RLS para saas_analytics
CREATE POLICY "Masters can view all analytics" ON public.saas_analytics
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'master'));

CREATE POLICY "Users can insert analytics for own company" ON public.saas_analytics
  FOR INSERT TO authenticated
  WITH CHECK (company_id = public.get_current_user_company_id());

-- Inserir dados iniciais

-- Inserir módulos do sistema
INSERT INTO public.saas_modules (name, description, category, icon, route_path, is_core) VALUES
('Dashboard', 'Painel principal com métricas e estatísticas', 'core', 'ChartBar', '/', true),
('Clientes', 'Gestão de clientes e contatos', 'sales', 'User', '/clientes', false),
('Produtos', 'Cadastro e gestão de produtos', 'inventory', 'Package', '/produtos', false),
('Fornecedores', 'Gestão de fornecedores', 'purchase', 'Users', '/fornecedores', false),
('Compras', 'Gestão de compras e pedidos', 'purchase', 'ShoppingCart', '/compras', false),
('Estoque', 'Controle de estoque', 'inventory', 'Warehouse', '/estoque', false),
('Pedidos', 'Gestão de pedidos de venda', 'sales', 'Package', '/pedidos', false),
('Produção', 'Controle de produção', 'production', 'Box', '/producao', false),
('Embalagem', 'Controle de embalagem', 'production', 'Box', '/embalagem', false),
('Vendas', 'Gestão de vendas', 'sales', 'DollarSign', '/vendas', false),
('Emissão Fiscal', 'Emissão de notas fiscais', 'fiscal', 'FilePen', '/emissao-fiscal', false),
('Financeiro', 'Gestão financeira', 'finance', 'DollarSign', '/financeiro', false),
('Roteirização', 'Planejamento de rotas', 'logistics', 'Truck', '/rotas', false),
('Calendário', 'Calendário de eventos', 'core', 'Calendar', '/calendario', false),
('Configurações', 'Configurações do sistema', 'core', 'Settings', '/configuracoes', true);

-- Inserir planos básicos
INSERT INTO public.saas_plans (name, description, price, billing_cycle, max_users) VALUES
('Básico', 'Plano básico com funcionalidades essenciais', 99.90, 'monthly', 5),
('Intermediário', 'Plano intermediário com mais funcionalidades', 199.90, 'monthly', 15),
('Premium', 'Plano completo com todas as funcionalidades', 399.90, 'monthly', NULL);

-- Associar módulos aos planos
WITH plan_basico AS (SELECT id FROM public.saas_plans WHERE name = 'Básico'),
     plan_intermediario AS (SELECT id FROM public.saas_plans WHERE name = 'Intermediário'),
     plan_premium AS (SELECT id FROM public.saas_plans WHERE name = 'Premium'),
     modules AS (SELECT id, name FROM public.saas_modules)

-- Plano Básico: Core + Clientes + Produtos + Pedidos
INSERT INTO public.saas_plan_modules (plan_id, module_id)
SELECT p.id, m.id FROM plan_basico p, modules m 
WHERE m.name IN ('Dashboard', 'Clientes', 'Produtos', 'Pedidos', 'Configurações')

UNION ALL

-- Plano Intermediário: Básico + Estoque + Vendas + Financeiro
SELECT p.id, m.id FROM plan_intermediario p, modules m 
WHERE m.name IN ('Dashboard', 'Clientes', 'Produtos', 'Pedidos', 'Estoque', 'Vendas', 'Financeiro', 'Calendário', 'Configurações')

UNION ALL

-- Plano Premium: Todos os módulos
SELECT p.id, m.id FROM plan_premium p, modules m;

-- Criar função para verificar se empresa tem acesso a um módulo
CREATE OR REPLACE FUNCTION public.company_has_module_access(company_id_param UUID, module_route TEXT)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE SECURITY DEFINER
AS $$
  WITH company_subscription AS (
    SELECT cs.plan_id 
    FROM public.company_subscriptions cs 
    WHERE cs.company_id = company_id_param 
      AND cs.status = 'active' 
      AND (cs.expires_at IS NULL OR cs.expires_at > now())
    LIMIT 1
  ),
  module_info AS (
    SELECT sm.id, sm.is_core
    FROM public.saas_modules sm 
    WHERE sm.route_path = module_route
  ),
  plan_has_module AS (
    SELECT EXISTS(
      SELECT 1 
      FROM public.saas_plan_modules spm
      INNER JOIN company_subscription cs ON spm.plan_id = cs.plan_id
      INNER JOIN module_info mi ON spm.module_id = mi.id
    ) AS has_via_plan
  ),
  custom_module_access AS (
    SELECT cm.enabled
    FROM public.company_modules cm
    INNER JOIN module_info mi ON cm.module_id = mi.id
    WHERE cm.company_id = company_id_param
  )
  
  SELECT CASE 
    -- Módulos core sempre liberados
    WHEN mi.is_core THEN true
    -- Verifica override customizado primeiro
    WHEN cma.enabled IS NOT NULL THEN cma.enabled
    -- Senão verifica se plano tem o módulo
    WHEN phm.has_via_plan THEN true
    -- Por padrão, não tem acesso
    ELSE false
  END
  FROM module_info mi
  LEFT JOIN plan_has_module phm ON true
  LEFT JOIN custom_module_access cma ON true;
$$;

-- Criar empresa padrão com plano premium se não existir
DO $$
DECLARE
  main_company_id UUID;
  premium_plan_id UUID;
BEGIN
  -- Buscar empresa main
  SELECT id INTO main_company_id FROM public.companies WHERE subdomain = 'main' LIMIT 1;
  
  -- Buscar plano premium
  SELECT id INTO premium_plan_id FROM public.saas_plans WHERE name = 'Premium' LIMIT 1;
  
  -- Se empresa main existe, criar assinatura premium
  IF main_company_id IS NOT NULL AND premium_plan_id IS NOT NULL THEN
    INSERT INTO public.company_subscriptions (company_id, plan_id, status)
    VALUES (main_company_id, premium_plan_id, 'active')
    ON CONFLICT DO NOTHING;
  END IF;
END $$;
