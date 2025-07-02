-- Ensure system modules exist for the application
INSERT INTO public.system_modules (name, route_path, description, category, icon, is_active, sort_order) VALUES
('Dashboard', '/', 'Painel principal do sistema', 'core', 'layout-dashboard', true, 1),
('Pedidos', '/pedidos', 'Gestão de pedidos', 'vendas', 'shopping-cart', true, 2),
('Produtos', '/produtos', 'Gestão de produtos', 'estoque', 'package', true, 3),
('Clientes', '/clientes', 'Gestão de clientes', 'vendas', 'users', true, 4),
('Produção', '/producao', 'Gestão de produção', 'operacoes', 'factory', true, 5),
('Embalagem', '/embalagem', 'Gestão de embalagem', 'operacoes', 'box', true, 6),
('Vendas', '/vendas', 'Gestão de vendas', 'vendas', 'trending-up', true, 7),
('Financeiro', '/financeiro', 'Gestão financeira', 'financeiro', 'dollar-sign', true, 8),
('Rotas', '/rotas', 'Gestão de rotas de entrega', 'logistica', 'map', true, 9),
('Configurações', '/configuracoes', 'Configurações do sistema', 'admin', 'settings', true, 10),
('Fornecedores', '/fornecedores', 'Gestão de fornecedores', 'compras', 'truck', true, 11),
('Compras', '/compras', 'Gestão de compras', 'compras', 'shopping-bag', true, 12),
('Estoque', '/estoque', 'Gestão de estoque', 'estoque', 'warehouse', true, 13),
('Emissão Fiscal', '/emissao-fiscal', 'Emissão de documentos fiscais', 'fiscal', 'file-text', true, 14),
('Ordens de Serviço', '/ordens-servico', 'Gestão de ordens de serviço', 'servicos', 'wrench', true, 15)
ON CONFLICT (route_path) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  category = EXCLUDED.category,
  icon = EXCLUDED.icon,
  is_active = EXCLUDED.is_active,
  sort_order = EXCLUDED.sort_order,
  updated_at = now();

-- Create default access profiles if they don't exist
INSERT INTO public.access_profiles (name, description, company_id, is_active, is_admin) VALUES
('Admin Completo', 'Acesso total ao sistema', (SELECT id FROM public.companies LIMIT 1), true, true),
('Usuário Vendas', 'Acesso aos módulos de vendas e clientes', (SELECT id FROM public.companies LIMIT 1), true, false),
('Usuário Produção', 'Acesso aos módulos de produção e estoque', (SELECT id FROM public.companies LIMIT 1), true, false),
('Usuário Financeiro', 'Acesso aos módulos financeiros', (SELECT id FROM public.companies LIMIT 1), true, false)
ON CONFLICT DO NOTHING;

-- Grant all modules to Admin profile
INSERT INTO public.profile_modules (profile_id, module_id, can_view, can_edit, can_delete)
SELECT 
  ap.id as profile_id,
  sm.id as module_id,
  true as can_view,
  true as can_edit,
  true as can_delete
FROM public.access_profiles ap
CROSS JOIN public.system_modules sm
WHERE ap.name = 'Admin Completo' AND ap.is_admin = true
ON CONFLICT (profile_id, module_id) DO UPDATE SET
  can_view = true,
  can_edit = true,
  can_delete = true;

-- Grant specific modules to Sales profile
INSERT INTO public.profile_modules (profile_id, module_id, can_view, can_edit, can_delete)
SELECT 
  ap.id as profile_id,
  sm.id as module_id,
  true as can_view,
  CASE WHEN sm.route_path IN ('/', '/pedidos', '/clientes', '/vendas', '/produtos') THEN true ELSE false END as can_edit,
  false as can_delete
FROM public.access_profiles ap
CROSS JOIN public.system_modules sm
WHERE ap.name = 'Usuário Vendas' 
  AND sm.route_path IN ('/', '/pedidos', '/clientes', '/vendas', '/produtos', '/configuracoes')
ON CONFLICT (profile_id, module_id) DO UPDATE SET
  can_view = true,
  can_edit = EXCLUDED.can_edit,
  can_delete = false;

-- Grant specific modules to Production profile
INSERT INTO public.profile_modules (profile_id, module_id, can_view, can_edit, can_delete)
SELECT 
  ap.id as profile_id,
  sm.id as module_id,
  true as can_view,
  CASE WHEN sm.route_path IN ('/', '/producao', '/embalagem', '/estoque', '/produtos') THEN true ELSE false END as can_edit,
  false as can_delete
FROM public.access_profiles ap
CROSS JOIN public.system_modules sm
WHERE ap.name = 'Usuário Produção' 
  AND sm.route_path IN ('/', '/producao', '/embalagem', '/estoque', '/produtos', '/configuracoes')
ON CONFLICT (profile_id, module_id) DO UPDATE SET
  can_view = true,
  can_edit = EXCLUDED.can_edit,
  can_delete = false;

-- Grant specific modules to Financial profile  
INSERT INTO public.profile_modules (profile_id, module_id, can_view, can_edit, can_delete)
SELECT 
  ap.id as profile_id,
  sm.id as module_id,
  true as can_view,
  CASE WHEN sm.route_path IN ('/', '/financeiro', '/fornecedores', '/compras', '/emissao-fiscal') THEN true ELSE false END as can_edit,
  false as can_delete
FROM public.access_profiles ap
CROSS JOIN public.system_modules sm
WHERE ap.name = 'Usuário Financeiro' 
  AND sm.route_path IN ('/', '/financeiro', '/fornecedores', '/compras', '/emissao-fiscal', '/configuracoes')
ON CONFLICT (profile_id, module_id) DO UPDATE SET
  can_view = true,
  can_edit = EXCLUDED.can_edit,
  can_delete = false;