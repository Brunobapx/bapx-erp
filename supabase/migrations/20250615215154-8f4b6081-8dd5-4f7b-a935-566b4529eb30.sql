
-- Adiciona uma restrição UNIQUE em route_path na tabela de módulos
ALTER TABLE public.saas_modules
  ADD CONSTRAINT saas_modules_route_path_unique UNIQUE (route_path);

-- Agora insere o módulo "Ordens de Serviço"
INSERT INTO public.saas_modules (name, description, category, icon, route_path) 
VALUES 
  (
    'Ordens de Serviço', 
    'Gestão de Ordens de Serviço (OS) dos clientes, controle de técnicos e materiais.', 
    'Operacional',
    'FilePen',
    '/ordens-servico'
  )
ON CONFLICT (route_path) DO NOTHING;
