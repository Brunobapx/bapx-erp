-- Registrar módulos Trocas e Nota Fiscal no sistema de módulos
INSERT INTO public.system_modules (name, route_path, icon, description, category) VALUES
('Trocas', '/trocas', 'RefreshCw', 'Gerenciamento de trocas e devoluções', 'operations'),
('Nota Fiscal', '/nota-fiscal', 'FileText', 'Emissão e gerenciamento de notas fiscais', 'fiscal')
ON CONFLICT (route_path) DO NOTHING;