-- Buscar um usuário da Bapx para criar produtos
-- Se não houver, usar o primeiro usuário admin do sistema
WITH bapx_user AS (
  SELECT id FROM profiles WHERE company_id = 'fbcf8d3f-d55e-4995-9a29-0048c0928a07' LIMIT 1
),
fallback_user AS (
  SELECT id FROM profiles WHERE id IN (
    SELECT user_id FROM user_roles WHERE role IN ('admin', 'master')
  ) LIMIT 1
)
INSERT INTO products (
  company_id, 
  user_id, 
  name, 
  description, 
  price, 
  cost, 
  stock, 
  category, 
  is_direct_sale, 
  is_active,
  unit,
  sku
) VALUES 
  (
    'fbcf8d3f-d55e-4995-9a29-0048c0928a07',
    COALESCE((SELECT id FROM bapx_user), (SELECT id FROM fallback_user)),
    'Sistema de Gestão Cloud',
    'Solução completa de gestão empresarial na nuvem com módulos integrados',
    299.90,
    150.00,
    100,
    'Software',
    true,
    true,
    'UN',
    'SGC-001'
  ),
  (
    'fbcf8d3f-d55e-4995-9a29-0048c0928a07',
    COALESCE((SELECT id FROM bapx_user), (SELECT id FROM fallback_user)),
    'Consultoria em TI',
    'Serviço especializado de consultoria para transformação digital',
    150.00,
    75.00,
    50,
    'Serviços',
    true,
    true,
    'HR',
    'CTI-001'
  ),
  (
    'fbcf8d3f-d55e-4995-9a29-0048c0928a07',
    COALESCE((SELECT id FROM bapx_user), (SELECT id FROM fallback_user)),
    'Licença Software Premium',
    'Licença anual do software premium com suporte 24/7',
    499.90,
    250.00,
    25,
    'Licenças',
    true,
    true,
    'UN',
    'LSP-001'
  );