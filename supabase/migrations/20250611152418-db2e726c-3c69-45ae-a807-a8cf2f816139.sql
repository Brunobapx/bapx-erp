
-- Inserir alguns módulos básicos apenas se não existirem
DO $$
BEGIN
  -- Verificar se já existem módulos, se não, inserir os básicos
  IF NOT EXISTS (SELECT 1 FROM public.saas_modules LIMIT 1) THEN
    INSERT INTO public.saas_modules (name, description, category, icon, route_path, is_core) VALUES
      ('Dashboard', 'Painel principal com estatísticas e resumos', 'Core', 'BarChart3', '/', true),
      ('Pedidos', 'Gestão completa de pedidos de clientes', 'Vendas', 'ShoppingCart', '/pedidos', false),
      ('Produtos', 'Cadastro e gestão de produtos', 'Estoque', 'Package', '/produtos', false),
      ('Clientes', 'Gestão de clientes e leads', 'CRM', 'Users', '/clientes', false),
      ('Financeiro', 'Contas a pagar e receber', 'Financeiro', 'DollarSign', '/financeiro', false),
      ('Produção', 'Controle de produção e manufatura', 'Produção', 'Factory', '/producao', false),
      ('Embalagem', 'Gestão de embalagem de produtos', 'Produção', 'Package2', '/embalagem', false),
      ('Vendas', 'Gestão de vendas e faturamento', 'Vendas', 'TrendingUp', '/vendas', false),
      ('Rotas', 'Planejamento de rotas de entrega', 'Logística', 'Route', '/rotas', false),
      ('Estoque', 'Controle de estoque e movimentações', 'Estoque', 'Warehouse', '/estoque', false),
      ('Fornecedores', 'Cadastro e gestão de fornecedores', 'Compras', 'Truck', '/fornecedores', false),
      ('Compras', 'Gestão de compras e notas fiscais', 'Compras', 'ShoppingBag', '/compras', false),
      ('Calendário', 'Agenda e planejamento', 'Produtividade', 'Calendar', '/calendario', false),
      ('Emissão Fiscal', 'Emissão de notas fiscais', 'Fiscal', 'FileText', '/emissao-fiscal', false),
      ('Configurações', 'Configurações do sistema', 'Core', 'Settings', '/configuracoes', true);
  END IF;
END $$;

-- Habilitar RLS nas novas tabelas
ALTER TABLE public.saas_plan_modules ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para saas_plan_modules (apenas usuários master podem gerenciar)
CREATE POLICY "Master users can manage plan modules" ON public.saas_plan_modules
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles 
      WHERE user_id = auth.uid() AND role = 'master'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_roles 
      WHERE user_id = auth.uid() AND role = 'master'
    )
  );

-- Políticas RLS para saas_modules (todos podem ler, apenas master pode modificar)
ALTER TABLE public.saas_modules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Everyone can view modules" ON public.saas_modules
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Master users can manage modules" ON public.saas_modules
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles 
      WHERE user_id = auth.uid() AND role = 'master'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_roles 
      WHERE user_id = auth.uid() AND role = 'master'
    )
  );
