
-- Inserir módulos do sistema organizados por categoria
INSERT INTO public.system_modules (id, name, route_path, description, category, icon, is_active, sort_order) VALUES
-- Dashboard
(gen_random_uuid(), 'Dashboard', '/', 'Painel principal do sistema', 'Dashboard', 'ChartBar', true, 1),

-- Vendas
(gen_random_uuid(), 'Clientes', '/clientes', 'Gestão de clientes', 'Vendas', 'Users', true, 10),
(gen_random_uuid(), 'Pedidos', '/pedidos', 'Gestão de pedidos', 'Vendas', 'ShoppingCart', true, 11),
(gen_random_uuid(), 'Vendas', '/vendas', 'Controle de vendas', 'Vendas', 'DollarSign', true, 12),
(gen_random_uuid(), 'Calendário', '/calendario', 'Agenda e eventos', 'Vendas', 'Calendar', true, 13),

-- Produtos
(gen_random_uuid(), 'Produtos', '/produtos', 'Gestão de produtos', 'Produtos', 'Package', true, 20),
(gen_random_uuid(), 'Fornecedores', '/fornecedores', 'Gestão de fornecedores', 'Produtos', 'Users', true, 21),
(gen_random_uuid(), 'Compras', '/compras', 'Gestão de compras', 'Produtos', 'ShoppingCart', true, 22),
(gen_random_uuid(), 'Estoque', '/estoque', 'Controle de estoque', 'Produtos', 'Warehouse', true, 23),

-- Produção
(gen_random_uuid(), 'Produção', '/producao', 'Controle de produção', 'Produção', 'Box', true, 30),
(gen_random_uuid(), 'Embalagem', '/embalagem', 'Controle de embalagem', 'Produção', 'Box', true, 31),

-- Financeiro
(gen_random_uuid(), 'Financeiro', '/financeiro', 'Gestão financeira', 'Financeiro', 'DollarSign', true, 40),
(gen_random_uuid(), 'Emissão Fiscal', '/emissao-fiscal', 'Emissão de notas fiscais', 'Financeiro', 'FilePen', true, 41),

-- Logística
(gen_random_uuid(), 'Rotas', '/rotas', 'Gestão de rotas de entrega', 'Logística', 'Truck', true, 50),

-- Serviços
(gen_random_uuid(), 'Ordens de Serviço', '/ordens-servico', 'Gestão de ordens de serviço', 'Serviços', 'FilePen', true, 60),

-- Configurações
(gen_random_uuid(), 'Configurações', '/configuracoes', 'Configurações do sistema', 'Sistema', 'Settings', true, 70);

-- Criar perfis de acesso padrão
INSERT INTO public.access_profiles (id, company_id, name, description, is_admin, is_active) 
SELECT 
  gen_random_uuid(),
  c.id,
  'Master',
  'Perfil master com acesso total ao sistema',
  true,
  true
FROM public.companies c;

INSERT INTO public.access_profiles (id, company_id, name, description, is_admin, is_active) 
SELECT 
  gen_random_uuid(),
  c.id,
  'Administrador',
  'Perfil administrativo com acesso amplo',
  true,
  true
FROM public.companies c;

INSERT INTO public.access_profiles (id, company_id, name, description, is_admin, is_active) 
SELECT 
  gen_random_uuid(),
  c.id,
  'Financeiro',
  'Acesso aos módulos financeiros e clientes',
  false,
  true
FROM public.companies c;

INSERT INTO public.access_profiles (id, company_id, name, description, is_admin, is_active) 
SELECT 
  gen_random_uuid(),
  c.id,
  'Vendas',
  'Acesso aos módulos de vendas e clientes',
  false,
  true
FROM public.companies c;

INSERT INTO public.access_profiles (id, company_id, name, description, is_admin, is_active) 
SELECT 
  gen_random_uuid(),
  c.id,
  'Produção',
  'Acesso aos módulos de produção e estoque',
  false,
  true
FROM public.companies c;

-- Configurar módulos para perfil Financeiro
INSERT INTO public.profile_modules (profile_id, module_id, can_view, can_edit, can_delete)
SELECT 
  ap.id,
  sm.id,
  true,
  true,
  false
FROM public.access_profiles ap
CROSS JOIN public.system_modules sm
WHERE ap.name = 'Financeiro'
AND sm.route_path IN ('/', '/clientes', '/fornecedores', '/financeiro', '/emissao-fiscal', '/configuracoes');

-- Configurar módulos para perfil Vendas
INSERT INTO public.profile_modules (profile_id, module_id, can_view, can_edit, can_delete)
SELECT 
  ap.id,
  sm.id,
  true,
  true,
  false
FROM public.access_profiles ap
CROSS JOIN public.system_modules sm
WHERE ap.name = 'Vendas'
AND sm.route_path IN ('/', '/clientes', '/produtos', '/pedidos', '/vendas', '/calendario', '/configuracoes');

-- Configurar módulos para perfil Produção
INSERT INTO public.profile_modules (profile_id, module_id, can_view, can_edit, can_delete)
SELECT 
  ap.id,
  sm.id,
  true,
  true,
  false
FROM public.access_profiles ap
CROSS JOIN public.system_modules sm
WHERE ap.name = 'Produção'
AND sm.route_path IN ('/', '/produtos', '/fornecedores', '/compras', '/estoque', '/producao', '/embalagem', '/configuracoes');
