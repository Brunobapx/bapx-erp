-- Inserir dados de teste se os módulos não existirem ainda
-- Verificar se existem módulos já cadastrados
INSERT INTO public.system_modules (id, name, route_path, description, category, icon, is_active, sort_order)
VALUES 
  ('f50d31ce-454d-4ee8-b3b7-1bc7faae1403', 'Dashboard', '/', 'Painel principal do sistema', 'core', 'layout-dashboard', true, 1),
  ('07c9d6eb-7aab-4aa6-928f-f3518173d221', 'Pedidos', '/pedidos', 'Gestão de pedidos', 'vendas', 'shopping-cart', true, 2),
  ('76814ae7-411d-4eaf-b6f0-1e20b58b573c', 'Produtos', '/produtos', 'Gestão de produtos', 'estoque', 'package', true, 3),
  ('0def7a69-d894-45c7-81d2-04feec9964bf', 'Clientes', '/clientes', 'Gestão de clientes', 'vendas', 'users', true, 4),
  ('d23bcbf7-95b3-4928-9b87-e41c0fb8474d', 'Produção', '/producao', 'Gestão de produção', 'operacoes', 'factory', true, 5),
  ('4100378d-fef8-4d70-bc5d-8c675eee234b', 'Embalagem', '/embalagem', 'Gestão de embalagem', 'operacoes', 'box', true, 6),
  ('a3d29879-a648-4114-bef1-6b45657924f7', 'Vendas', '/vendas', 'Gestão de vendas', 'vendas', 'trending-up', true, 7),
  ('cf4197e8-c7d3-431f-9cab-c6542f2c200e', 'Financeiro', '/financeiro', 'Gestão financeira', 'financeiro', 'dollar-sign', true, 8),
  ('373cf5f0-b7f6-4120-aca7-16ca7b7a05b1', 'Rotas', '/rotas', 'Gestão de rotas de entrega', 'logistica', 'map', true, 9),
  ('a6454656-ef25-4e10-94a3-0d89056ec6d1', 'Configurações', '/configuracoes', 'Configurações do sistema', 'admin', 'settings', true, 10),
  ('2099aa10-2afd-46b1-885b-a10b24787a7d', 'Fornecedores', '/fornecedores', 'Gestão de fornecedores', 'compras', 'truck', true, 11),
  ('7e489560-4d16-4ec9-8a90-f5845104b278', 'Compras', '/compras', 'Gestão de compras', 'compras', 'shopping-bag', true, 12),
  ('648dabc8-9cb1-41ed-943e-452521d9f83a', 'Calendário', '/calendario', 'Agenda e eventos', 'vendas', 'calendar', true, 13),
  ('9d410f4c-0a59-4917-8d37-560609dab1fa', 'Estoque', '/estoque', 'Gestão de estoque', 'estoque', 'warehouse', true, 13),
  ('d9929d1a-204f-412e-a364-fbbfd8d87729', 'Emissão Fiscal', '/emissao-fiscal', 'Emissão de documentos fiscais', 'fiscal', 'file-text', true, 14),
  ('1e3bd310-4a4e-412e-b0e7-82c4d586e5fd', 'Ordens de Serviço', '/ordens-servico', 'Gestão de ordens de serviço', 'servicos', 'wrench', true, 15)
ON CONFLICT (id) DO NOTHING;