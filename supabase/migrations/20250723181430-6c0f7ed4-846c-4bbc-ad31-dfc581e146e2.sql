-- Registrar módulos Trocas e Nota Fiscal no sistema de módulos
INSERT INTO public.system_modules (name, route_path, icon, description, is_core, display_order) VALUES
('Trocas', '/trocas', 'RefreshCw', 'Gerenciamento de trocas e devoluções', false, 13),
('Nota Fiscal', '/nota-fiscal', 'FileText', 'Emissão e gerenciamento de notas fiscais', false, 14)
ON CONFLICT (route_path) DO NOTHING;

-- Dar permissão completa para admins e masters nos novos módulos
INSERT INTO public.user_role_permissions (role, module_id, can_access)
SELECT 'admin', id, true FROM public.system_modules WHERE route_path IN ('/trocas', '/nota-fiscal')
ON CONFLICT (role, module_id) DO NOTHING;

INSERT INTO public.user_role_permissions (role, module_id, can_access)
SELECT 'master', id, true FROM public.system_modules WHERE route_path IN ('/trocas', '/nota-fiscal')
ON CONFLICT (role, module_id) DO NOTHING;