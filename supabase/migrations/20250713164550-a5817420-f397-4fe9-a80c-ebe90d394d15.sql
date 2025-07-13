-- Create system_sub_modules table for tab definitions
CREATE TABLE public.system_sub_modules (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  parent_module_id UUID NOT NULL,
  name TEXT NOT NULL,
  tab_key TEXT NOT NULL,
  description TEXT,
  icon TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(parent_module_id, tab_key)
);

-- Create user_tab_permissions table for tab access control
CREATE TABLE public.user_tab_permissions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  sub_module_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, sub_module_id)
);

-- Add foreign key constraints
ALTER TABLE public.system_sub_modules 
ADD CONSTRAINT fk_parent_module 
FOREIGN KEY (parent_module_id) REFERENCES public.system_modules(id) ON DELETE CASCADE;

ALTER TABLE public.user_tab_permissions 
ADD CONSTRAINT fk_sub_module 
FOREIGN KEY (sub_module_id) REFERENCES public.system_sub_modules(id) ON DELETE CASCADE;

-- Enable RLS
ALTER TABLE public.system_sub_modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_tab_permissions ENABLE ROW LEVEL SECURITY;

-- RLS policies for system_sub_modules (anyone can view active sub-modules)
CREATE POLICY "Anyone can view active sub-modules" 
ON public.system_sub_modules 
FOR SELECT 
USING (is_active = true);

-- RLS policies for user_tab_permissions (users can view their own permissions, admins can manage all)
CREATE POLICY "Users can view their own tab permissions" 
ON public.user_tab_permissions 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all tab permissions" 
ON public.user_tab_permissions 
FOR ALL 
USING (public.is_admin(auth.uid()));

-- Insert default sub-modules for Production page
INSERT INTO public.system_sub_modules (parent_module_id, name, tab_key, description, icon, sort_order)
SELECT 
  sm.id,
  unnest(ARRAY['Produções Individuais', 'Produção Interna', 'Resumo por Produto']),
  unnest(ARRAY['individual', 'internal', 'summary']),
  unnest(ARRAY['Gerenciar produções individuais por pedido', 'Controlar produção interna', 'Visualizar resumo de produção por produto']),
  unnest(ARRAY['package', 'settings', 'bar-chart']),
  unnest(ARRAY[1, 2, 3])
FROM public.system_modules sm 
WHERE sm.route_path = '/producao';

-- Insert default sub-modules for Finance page
INSERT INTO public.system_sub_modules (parent_module_id, name, tab_key, description, icon, sort_order)
SELECT 
  sm.id,
  unnest(ARRAY['Visão Geral', 'Contas a Receber', 'Contas a Pagar', 'Fluxo de Caixa', 'Conciliação Bancária', 'DRE', 'Relatórios', 'Configurações']),
  unnest(ARRAY['overview', 'receivables', 'payables', 'cashflow', 'reconciliation', 'dre', 'reports', 'settings']),
  unnest(ARRAY['Visão geral das finanças', 'Gerenciar contas a receber', 'Gerenciar contas a pagar', 'Controle de fluxo de caixa', 'Conciliação bancária', 'Demonstrativo de resultado', 'Relatórios financeiros', 'Configurações financeiras']),
  unnest(ARRAY['eye', 'arrow-down', 'arrow-up', 'trending-up', 'git-merge', 'file-bar-chart', 'file-text', 'settings']),
  unnest(ARRAY[1, 2, 3, 4, 5, 6, 7, 8])
FROM public.system_modules sm 
WHERE sm.route_path = '/financeiro';