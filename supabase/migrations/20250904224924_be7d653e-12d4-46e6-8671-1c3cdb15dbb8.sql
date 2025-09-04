-- Ativar produtos da Artisan para venda direta no e-commerce
UPDATE products 
SET is_direct_sale = true, 
    stock = CASE 
      WHEN stock = 0 THEN 50 
      ELSE stock 
    END
WHERE company_id = 'e6b7f98c-143e-4271-bfaf-7b30c6ad2c83' 
  AND is_active = true
  AND id IN (
    SELECT id FROM products 
    WHERE company_id = 'e6b7f98c-143e-4271-bfaf-7b30c6ad2c83' 
      AND is_active = true 
    ORDER BY created_at DESC 
    LIMIT 5
  );

-- Criar produtos de exemplo para Bapx Tecnologia
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
) 
SELECT 
  'fbcf8d3f-d55e-4995-9a29-0048c0928a07',
  p.id,
  v.name,
  v.description,
  v.price,
  v.cost,
  v.stock,
  v.category,
  true,
  true,
  v.unit,
  v.sku
FROM profiles p
CROSS JOIN (VALUES 
  ('Sistema de Gestão Cloud', 'Solução completa de gestão empresarial na nuvem com módulos integrados', 299.90, 150.00, 100, 'Software', 'UN', 'SGC-001'),
  ('Consultoria em TI', 'Serviço especializado de consultoria para transformação digital', 150.00, 75.00, 50, 'Serviços', 'HR', 'CTI-001'),
  ('Licença Software Premium', 'Licença anual do software premium com suporte 24/7', 499.90, 250.00, 25, 'Licenças', 'UN', 'LSP-001')
) AS v(name, description, price, cost, stock, category, unit, sku)
WHERE p.company_id = 'fbcf8d3f-d55e-4995-9a29-0048c0928a07'
LIMIT 1;