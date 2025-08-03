-- Marcar produtos de hambúrguer como fabricados
UPDATE products 
SET is_manufactured = true, is_direct_sale = false
WHERE name LIKE '%HAMB%' OR name LIKE '%HOT DOG%';

-- Adicionar alguns dados de exemplo para demonstrar o funcionamento
INSERT INTO production (
  user_id, product_id, product_name, quantity_requested, status, production_number
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  (SELECT id FROM products WHERE name LIKE '%HAMB%' LIMIT 1),
  (SELECT name FROM products WHERE name LIKE '%HAMB%' LIMIT 1),
  10,
  'pending',
  'PR-001'
);

INSERT INTO packaging (
  user_id, product_id, product_name, quantity_to_package, status, packaging_number
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  (SELECT id FROM products WHERE name LIKE '%HAMB%' LIMIT 1),
  (SELECT name FROM products WHERE name LIKE '%HAMB%' LIMIT 1),
  8,
  'pending',
  'EMB-001'
);