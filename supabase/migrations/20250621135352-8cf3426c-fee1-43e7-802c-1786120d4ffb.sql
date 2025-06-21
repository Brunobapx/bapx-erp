
-- Corrigir problema de chave estrangeira antes de recriar a estrutura

-- 1. Primeiro, remover referências de profile_id na tabela profiles
UPDATE public.profiles SET profile_id = NULL;

-- 2. Limpar tabelas relacionadas na ordem correta
DELETE FROM public.profile_modules;
DELETE FROM public.access_profiles;

-- 3. Limpar e repovoar system_modules
DELETE FROM public.system_modules;
INSERT INTO public.system_modules (name, route_path, description, category, icon, sort_order) VALUES
('Dashboard', '/', 'Painel principal com visão geral do sistema', 'Principal', 'ChartBar', 1),
('Clientes', '/clientes', 'Gestão completa de clientes', 'Comercial', 'User', 2),
('Produtos', '/produtos', 'Catálogo e gestão de produtos', 'Produtos', 'Package', 3),
('Fornecedores', '/fornecedores', 'Gestão de fornecedores', 'Compras', 'Users', 4),
('Compras', '/compras', 'Gestão de compras e fornecedores', 'Compras', 'ShoppingCart', 5),
('Estoque', '/estoque', 'Controle de estoque e inventário', 'Produtos', 'Warehouse', 6),
('Pedidos', '/pedidos', 'Gestão de pedidos de clientes', 'Comercial', 'Package', 7),
('Produção', '/producao', 'Controle de produção', 'Produção', 'Box', 8),
('Embalagem', '/embalagem', 'Controle de embalagem de produtos', 'Produção', 'Box', 9),
('Vendas', '/vendas', 'Gestão de vendas e faturamento', 'Comercial', 'DollarSign', 10),
('Emissão Fiscal', '/emissao-fiscal', 'Emissão de notas fiscais', 'Fiscal', 'FilePen', 11),
('Financeiro', '/financeiro', 'Gestão financeira e contas', 'Financeiro', 'DollarSign', 12),
('Roteirização', '/rotas', 'Gestão de rotas de entrega', 'Logística', 'Truck', 13),
('Calendário', '/calendario', 'Calendário de eventos e tarefas', 'Ferramentas', 'Calendar', 14),
('Ordens de Serviço', '/ordens-servico', 'Gestão de ordens de serviço', 'Serviços', 'FilePen', 15),
('Configurações', '/configuracoes', 'Configurações do sistema', 'Sistema', 'Settings', 16);

-- 4. Obter ID da empresa BAPX ERP e recriar estrutura
DO $$
DECLARE
    bapx_company_id UUID;
BEGIN
    SELECT id INTO bapx_company_id FROM public.companies WHERE name = 'BAPX ERP' LIMIT 1;
    
    IF bapx_company_id IS NULL THEN
        RAISE EXCEPTION 'Empresa BAPX ERP não encontrada';
    END IF;
    
    -- Inserir perfis básicos
    INSERT INTO public.access_profiles (company_id, name, description, is_admin, is_active) VALUES
    (bapx_company_id, 'Master', 'Acesso total ao sistema - Super administrador', true, true),
    (bapx_company_id, 'Administrador', 'Acesso administrativo completo exceto configurações de sistema', true, true),
    (bapx_company_id, 'Vendas', 'Perfil para equipe de vendas - acesso a clientes, produtos, pedidos e vendas', false, true),
    (bapx_company_id, 'Técnico', 'Perfil técnico - acesso a produção, embalagem e ordens de serviço', false, true),
    (bapx_company_id, 'Financeiro', 'Perfil financeiro - acesso a vendas, financeiro e emissão fiscal', false, true),
    (bapx_company_id, 'Operacional', 'Perfil operacional - acesso a estoque, produção e logística', false, true);
    
    -- Master: Acesso total a todos os módulos
    INSERT INTO public.profile_modules (profile_id, module_id, can_view, can_edit, can_delete)
    SELECT ap.id, sm.id, true, true, true
    FROM public.access_profiles ap
    CROSS JOIN public.system_modules sm
    WHERE ap.name = 'Master' AND ap.company_id = bapx_company_id;
    
    -- Administrador: Acesso a tudo exceto configurações
    INSERT INTO public.profile_modules (profile_id, module_id, can_view, can_edit, can_delete)
    SELECT ap.id, sm.id, true, true, true
    FROM public.access_profiles ap
    CROSS JOIN public.system_modules sm
    WHERE ap.name = 'Administrador' AND ap.company_id = bapx_company_id
    AND sm.route_path != '/configuracoes';
    
    -- Vendas: Dashboard, Clientes, Produtos, Pedidos, Vendas
    INSERT INTO public.profile_modules (profile_id, module_id, can_view, can_edit, can_delete)
    SELECT ap.id, sm.id, true, true, false
    FROM public.access_profiles ap
    CROSS JOIN public.system_modules sm
    WHERE ap.name = 'Vendas' AND ap.company_id = bapx_company_id
    AND sm.route_path IN ('/', '/clientes', '/produtos', '/pedidos', '/vendas', '/calendario');
    
    -- Técnico: Dashboard, Clientes, Produtos, Produção, Embalagem, Ordens de Serviço
    INSERT INTO public.profile_modules (profile_id, module_id, can_view, can_edit, can_delete)
    SELECT ap.id, sm.id, true, true, false
    FROM public.access_profiles ap
    CROSS JOIN public.system_modules sm
    WHERE ap.name = 'Técnico' AND ap.company_id = bapx_company_id
    AND sm.route_path IN ('/', '/clientes', '/produtos', '/producao', '/embalagem', '/ordens-servico', '/calendario');
    
    -- Financeiro: Dashboard, Clientes, Vendas, Financeiro, Emissão Fiscal
    INSERT INTO public.profile_modules (profile_id, module_id, can_view, can_edit, can_delete)
    SELECT ap.id, sm.id, true, true, false
    FROM public.access_profiles ap
    CROSS JOIN public.system_modules sm
    WHERE ap.name = 'Financeiro' AND ap.company_id = bapx_company_id
    AND sm.route_path IN ('/', '/clientes', '/vendas', '/financeiro', '/emissao-fiscal', '/calendario');
    
    -- Operacional: Dashboard, Produtos, Estoque, Produção, Embalagem, Rotas
    INSERT INTO public.profile_modules (profile_id, module_id, can_view, can_edit, can_delete)
    SELECT ap.id, sm.id, true, true, false
    FROM public.access_profiles ap
    CROSS JOIN public.system_modules sm
    WHERE ap.name = 'Operacional' AND ap.company_id = bapx_company_id
    AND sm.route_path IN ('/', '/produtos', '/estoque', '/producao', '/embalagem', '/rotas', '/calendario');
    
    -- Associar Bruno ao perfil Master
    UPDATE public.profiles 
    SET profile_id = (
        SELECT id FROM public.access_profiles 
        WHERE name = 'Master' AND company_id = bapx_company_id
    )
    WHERE id IN (
        SELECT u.id FROM auth.users u 
        WHERE u.email = 'bruno@bapx.com.br'
    );
    
    RAISE NOTICE 'Estrutura base recriada com sucesso';
END $$;
