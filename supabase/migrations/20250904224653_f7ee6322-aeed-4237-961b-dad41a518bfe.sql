-- Ativar e-commerce para mais empresas para teste
INSERT INTO company_ecommerce_settings (
  company_id, 
  store_name, 
  store_description, 
  is_active, 
  payment_methods, 
  shipping_settings, 
  theme_settings
) VALUES 
  (
    'fbcf8d3f-d55e-4995-9a29-0048c0928a07', -- Bapx Tecnologia
    'Loja Bapx',
    'Soluções tecnológicas inovadoras para o seu negócio',
    true,
    '["credit_card", "pix", "boleto"]'::jsonb,
    '{"default_shipping": 12.90, "free_shipping_min": 80}'::jsonb,
    '{"primary_color": "#0066cc", "secondary_color": "#ffffff"}'::jsonb
  ),
  (
    'b92549cf-3687-4428-af5e-1c0bb8290d51', -- Ravis
    'Loja Ravis',
    'Produtos exclusivos com qualidade garantida',
    true,
    '["credit_card", "pix"]'::jsonb,
    '{"default_shipping": 18.90, "free_shipping_min": 120}'::jsonb,
    '{"primary_color": "#cc0066", "secondary_color": "#f8f9fa"}'::jsonb
  )
ON CONFLICT (company_id) 
DO UPDATE SET 
  is_active = EXCLUDED.is_active,
  store_name = EXCLUDED.store_name,
  store_description = EXCLUDED.store_description,
  payment_methods = EXCLUDED.payment_methods,
  shipping_settings = EXCLUDED.shipping_settings,
  theme_settings = EXCLUDED.theme_settings;