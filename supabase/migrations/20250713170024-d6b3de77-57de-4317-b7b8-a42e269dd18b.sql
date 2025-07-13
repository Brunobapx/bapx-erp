-- Inserir sub-módulos para as páginas que faltavam

-- Sub-módulos para Produtos
INSERT INTO system_sub_modules (parent_module_id, name, tab_key, description, icon, sort_order) 
SELECT 
  sm.id,
  'Produtos',
  'products',
  'Gerenciar produtos e estoque',
  'Package',
  1
FROM system_modules sm 
WHERE sm.route_path = '/products';

INSERT INTO system_sub_modules (parent_module_id, name, tab_key, description, icon, sort_order) 
SELECT 
  sm.id,
  'Categorias',
  'categories',
  'Gerenciar categorias de produtos',
  'Tags',
  2
FROM system_modules sm 
WHERE sm.route_path = '/products';

INSERT INTO system_sub_modules (parent_module_id, name, tab_key, description, icon, sort_order) 
SELECT 
  sm.id,
  'Markup',
  'markup',
  'Configurar markup de produtos',
  'Calculator',
  3
FROM system_modules sm 
WHERE sm.route_path = '/products';

-- Sub-módulos para Relatórios
INSERT INTO system_sub_modules (parent_module_id, name, tab_key, description, icon, sort_order) 
SELECT 
  sm.id,
  'Comissões',
  'commissions',
  'Relatório de comissões',
  'TrendingUp',
  1
FROM system_modules sm 
WHERE sm.route_path = '/relatorios';

INSERT INTO system_sub_modules (parent_module_id, name, tab_key, description, icon, sort_order) 
SELECT 
  sm.id,
  'Comissões Geradas',
  'generated',
  'Comissões já geradas',
  'Receipt',
  2
FROM system_modules sm 
WHERE sm.route_path = '/relatorios';

INSERT INTO system_sub_modules (parent_module_id, name, tab_key, description, icon, sort_order) 
SELECT 
  sm.id,
  'Vendas',
  'sales',
  'Relatório de vendas',
  'FileText',
  3
FROM system_modules sm 
WHERE sm.route_path = '/relatorios';

-- Sub-módulos para Configurações
INSERT INTO system_sub_modules (parent_module_id, name, tab_key, description, icon, sort_order) 
SELECT 
  sm.id,
  'Empresa',
  'company',
  'Configurações da empresa',
  'Building',
  1
FROM system_modules sm 
WHERE sm.route_path = '/configuracoes';

INSERT INTO system_sub_modules (parent_module_id, name, tab_key, description, icon, sort_order) 
SELECT 
  sm.id,
  'Usuários',
  'users',
  'Gerenciar usuários do sistema',
  'Users',
  2
FROM system_modules sm 
WHERE sm.route_path = '/configuracoes';

INSERT INTO system_sub_modules (parent_module_id, name, tab_key, description, icon, sort_order) 
SELECT 
  sm.id,
  'Sistema',
  'system',
  'Configurações do sistema',
  'Settings',
  3
FROM system_modules sm 
WHERE sm.route_path = '/configuracoes';

INSERT INTO system_sub_modules (parent_module_id, name, tab_key, description, icon, sort_order) 
SELECT 
  sm.id,
  'Fiscal',
  'fiscal',
  'Configurações fiscais',
  'Receipt',
  4
FROM system_modules sm 
WHERE sm.route_path = '/configuracoes';

INSERT INTO system_sub_modules (parent_module_id, name, tab_key, description, icon, sort_order) 
SELECT 
  sm.id,
  'Segurança',
  'security',
  'Configurações de segurança',
  'Shield',
  5
FROM system_modules sm 
WHERE sm.route_path = '/configuracoes';

-- Sub-módulos para Rotas
INSERT INTO system_sub_modules (parent_module_id, name, tab_key, description, icon, sort_order) 
SELECT 
  sm.id,
  'Rotas',
  'routes',
  'Visualizar e gerenciar rotas',
  'Truck',
  1
FROM system_modules sm 
WHERE sm.route_path = '/routes';

INSERT INTO system_sub_modules (parent_module_id, name, tab_key, description, icon, sort_order) 
SELECT 
  sm.id,
  'Veículos',
  'vehicles',
  'Gerenciar veículos',
  'Plus',
  2
FROM system_modules sm 
WHERE sm.route_path = '/routes';

INSERT INTO system_sub_modules (parent_module_id, name, tab_key, description, icon, sort_order) 
SELECT 
  sm.id,
  'Criar Rotas',
  'create-route',
  'Criar novas rotas',
  'Route',
  3
FROM system_modules sm 
WHERE sm.route_path = '/routes';

INSERT INTO system_sub_modules (parent_module_id, name, tab_key, description, icon, sort_order) 
SELECT 
  sm.id,
  'Rotas Otimizadas',
  'rotas-otimizadas',
  'Visualizar rotas otimizadas',
  'Zap',
  4
FROM system_modules sm 
WHERE sm.route_path = '/routes';

INSERT INTO system_sub_modules (parent_module_id, name, tab_key, description, icon, sort_order) 
SELECT 
  sm.id,
  'Otimização OpenRoute',
  'otimizacao-roteiro',
  'Otimização usando OpenRoute',
  'Target',
  5
FROM system_modules sm 
WHERE sm.route_path = '/routes';

-- Sub-módulos para Ordens de Serviço
INSERT INTO system_sub_modules (parent_module_id, name, tab_key, description, icon, sort_order) 
SELECT 
  sm.id,
  'Ordens de Serviço',
  'service-orders',
  'Gerenciar ordens de serviço',
  'Wrench',
  1
FROM system_modules sm 
WHERE sm.route_path = '/service-orders';

-- Sub-módulos para Estoque
INSERT INTO system_sub_modules (parent_module_id, name, tab_key, description, icon, sort_order) 
SELECT 
  sm.id,
  'Estoque',
  'stock',
  'Controle de estoque',
  'Package',
  1
FROM system_modules sm 
WHERE sm.route_path = '/stock';

INSERT INTO system_sub_modules (parent_module_id, name, tab_key, description, icon, sort_order) 
SELECT 
  sm.id,
  'Relatórios',
  'reports',
  'Relatórios de estoque',
  'BarChart',
  2
FROM system_modules sm 
WHERE sm.route_path = '/stock';