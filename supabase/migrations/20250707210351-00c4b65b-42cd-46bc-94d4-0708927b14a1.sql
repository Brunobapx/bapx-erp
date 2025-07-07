-- Inserir dados iniciais na tabela system_modules se ela estiver vazia
INSERT INTO public.system_modules (name, route_path, description, category, icon, is_active, sort_order)
SELECT * FROM (VALUES
  ('Dashboard', '/', 'Painel principal do sistema', 'Principal', 'BarChart3', true, 1),
  ('Clientes', '/clientes', 'Gestão de clientes', 'Vendas', 'Users', true, 2),
  ('Produtos', '/produtos', 'Gestão de produtos', 'Vendas', 'Package', true, 3),
  ('Pedidos', '/pedidos', 'Gestão de pedidos', 'Vendas', 'ShoppingCart', true, 4),
  ('Vendas', '/vendas', 'Gestão de vendas', 'Vendas', 'TrendingUp', true, 5),
  ('Financeiro', '/financeiro', 'Gestão financeira', 'Financeiro', 'DollarSign', true, 6),
  ('Produção', '/producao', 'Gestão de produção', 'Operações', 'Factory', true, 7),
  ('Embalagem', '/embalagem', 'Gestão de embalagem', 'Operações', 'Package2', true, 8),
  ('Estoque', '/estoque', 'Gestão de estoque', 'Operações', 'Warehouse', true, 9),
  ('Compras', '/compras', 'Gestão de compras', 'Operações', 'ShoppingBag', true, 10),
  ('Fornecedores', '/fornecedores', 'Gestão de fornecedores', 'Operações', 'Truck', true, 11),
  ('Rotas', '/rotas', 'Gestão de rotas de entrega', 'Logística', 'Route', true, 12),
  ('Ordens de Serviço', '/ordens-servico', 'Gestão de ordens de serviço', 'Serviços', 'Wrench', true, 13),
  ('Emissão Fiscal', '/emissao-fiscal', 'Emissão de documentos fiscais', 'Fiscal', 'FileText', true, 14),
  ('Calendário', '/calendario', 'Calendário de eventos', 'Utilitários', 'Calendar', true, 15),
  ('Configurações', '/configuracoes', 'Configurações do sistema', 'Sistema', 'Settings', true, 16)
) AS t(name, route_path, description, category, icon, is_active, sort_order)
WHERE NOT EXISTS (SELECT 1 FROM public.system_modules LIMIT 1);