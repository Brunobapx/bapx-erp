-- Inserir módulo de relatórios no sistema
INSERT INTO public.system_modules (name, route_path, category, icon, description, sort_order, is_active)
VALUES (
  'Relatórios',
  '/relatorios',
  'analytics',
  'TrendingUp',
  'Visualize relatórios de comissões e vendas',
  100,
  true
) ON CONFLICT (route_path) DO NOTHING;