-- Adicionar configurações para Focus NFe
INSERT INTO public.system_settings (key, value, description, category) VALUES
('focus_nfe_token', '""', 'Token de acesso Focus NFe', 'fiscal'),
('focus_nfe_environment', '"homologacao"', 'Ambiente Focus NFe (homologacao ou producao)', 'fiscal'),
('focus_nfe_enabled', 'false', 'Habilitar emissão de NF-e via Focus NFe', 'fiscal')
ON CONFLICT (key) DO NOTHING;