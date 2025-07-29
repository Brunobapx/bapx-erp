import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    console.log('Starting database initialization...')

    // Check if database is already initialized
    const { data: existingTables } = await supabase
      .from('system_settings')
      .select('*')
      .eq('key', 'database_initialized')
      .limit(1)

    if (existingTables && existingTables.length > 0) {
      console.log('Database already initialized')
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'Database already initialized',
          alreadyInitialized: true 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log('Database not initialized. Starting setup...')

    // Create system status table first
    await supabase.rpc('execute_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS public.system_status (
          id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
          status text NOT NULL,
          initialized_at timestamp with time zone DEFAULT now(),
          version text DEFAULT '1.0.0',
          created_at timestamp with time zone DEFAULT now()
        );
        
        ALTER TABLE public.system_status ENABLE ROW LEVEL SECURITY;
        
        CREATE POLICY "Anyone can view system status" ON public.system_status
        FOR SELECT USING (true);
        
        CREATE POLICY "System can manage status" ON public.system_status
        FOR ALL USING (true);
      `
    })

    // Mark initialization as started
    await supabase
      .from('system_status')
      .insert([{ status: 'initializing' }])

    // Initialize all system data
    await initializeSystemModules(supabase)
    await initializeDefaultSettings(supabase)
    await createMasterUser(supabase)

    // Mark as completed
    await supabase
      .from('system_settings')
      .insert([
        { 
          key: 'database_initialized', 
          value: { initialized_at: new Date().toISOString(), version: '1.0.0' },
          category: 'system'
        }
      ])

    await supabase
      .from('system_status')
      .update({ status: 'completed' })
      .eq('status', 'initializing')

    console.log('Database initialization completed successfully')

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Database initialized successfully',
        masterUser: { email: 'bapx@bapx.com.br', password: '123456' }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error initializing database:', error)
    
    // Mark as failed
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    
    await supabase
      .from('system_status')
      .update({ status: 'failed' })
      .eq('status', 'initializing')

    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message 
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})

async function initializeSystemModules(supabase: any) {
  console.log('Initializing system modules...')
  
  const modules = [
    { name: 'Dashboard', route_path: '/', category: 'main', icon: 'BarChart3', sort_order: 1 },
    { name: 'Pedidos', route_path: '/pedidos', category: 'sales', icon: 'ShoppingCart', sort_order: 2 },
    { name: 'Vendas', route_path: '/vendas', category: 'sales', icon: 'TrendingUp', sort_order: 3 },
    { name: 'Clientes', route_path: '/clientes', category: 'management', icon: 'Users', sort_order: 4 },
    { name: 'Produtos', route_path: '/produtos', category: 'inventory', icon: 'Package', sort_order: 5 },
    { name: 'Estoque', route_path: '/estoque', category: 'inventory', icon: 'Warehouse', sort_order: 6 },
    { name: 'Produção', route_path: '/producao', category: 'production', icon: 'Settings', sort_order: 7 },
    { name: 'Embalagem', route_path: '/embalagem', category: 'production', icon: 'Package2', sort_order: 8 },
    { name: 'Financeiro', route_path: '/financeiro', category: 'finance', icon: 'DollarSign', sort_order: 9 },
    { name: 'Compras', route_path: '/compras', category: 'procurement', icon: 'ShoppingBag', sort_order: 10 },
    { name: 'Fornecedores', route_path: '/fornecedores', category: 'management', icon: 'Truck', sort_order: 11 },
    { name: 'Rotas', route_path: '/rotas', category: 'logistics', icon: 'Route', sort_order: 12 },
    { name: 'Nota Fiscal', route_path: '/nota-fiscal', category: 'fiscal', icon: 'FileText', sort_order: 13 },
    { name: 'Trocas', route_path: '/trocas', category: 'service', icon: 'RotateCcw', sort_order: 14 },
    { name: 'Ordem de Serviço', route_path: '/ordem-servico', category: 'service', icon: 'Wrench', sort_order: 15 },
    { name: 'Relatórios', route_path: '/relatorios', category: 'reports', icon: 'BarChart', sort_order: 16 },
    { name: 'Configurações', route_path: '/configuracoes', category: 'admin', icon: 'Settings', sort_order: 17 }
  ]

  await supabase.from('system_modules').insert(modules)
}

async function initializeDefaultSettings(supabase: any) {
  console.log('Initializing default settings...')
  
  const settings = [
    {
      key: 'company_name',
      value: { name: 'Minha Empresa' },
      category: 'company',
      description: 'Nome da empresa'
    },
    {
      key: 'default_markup',
      value: { 
        fixed_expenses_percentage: 15,
        variable_expenses_percentage: 10,
        default_profit_margin: 30
      },
      category: 'pricing',
      description: 'Configurações padrão de markup'
    },
    {
      key: 'fiscal_config',
      value: {
        regime_tributario: '1',
        tipo_empresa: 'MEI',
        cfop_padrao: '5101',
        cst_padrao: '00',
        icms_percentual: 18,
        pis_percentual: 1.65,
        cofins_percentual: 7.6
      },
      category: 'fiscal',
      description: 'Configurações fiscais padrão'
    }
  ]

  await supabase.from('system_settings').insert(settings)

  // Create default financial categories
  const categories = [
    { name: 'Vendas', type: 'receita', description: 'Receitas de vendas', is_active: true },
    { name: 'Serviços', type: 'receita', description: 'Receitas de serviços', is_active: true },
    { name: 'Compras', type: 'despesa', description: 'Despesas com compras', is_active: true },
    { name: 'Salários', type: 'despesa', description: 'Despesas com salários', is_active: true },
    { name: 'Impostos', type: 'despesa', description: 'Despesas com impostos', is_active: true },
    { name: 'Energia', type: 'despesa', description: 'Despesas com energia elétrica', is_active: true },
    { name: 'Telefone', type: 'despesa', description: 'Despesas com telefone/internet', is_active: true }
  ]

  await supabase.from('financial_categories').insert(categories)

  // Create default payment methods
  const paymentMethods = [
    { name: 'Dinheiro', description: 'Pagamento em dinheiro', is_active: true },
    { name: 'PIX', description: 'Transferência PIX', is_active: true },
    { name: 'Cartão Débito', description: 'Cartão de débito', is_active: true },
    { name: 'Cartão Crédito', description: 'Cartão de crédito', is_active: true },
    { name: 'Transferência', description: 'Transferência bancária', is_active: true },
    { name: 'Cheque', description: 'Pagamento em cheque', is_active: true }
  ]

  await supabase.from('payment_methods').insert(paymentMethods)

  // Create default payment terms
  const paymentTerms = [
    { name: 'À Vista', days: 0, description: 'Pagamento à vista', is_active: true },
    { name: '30 dias', days: 30, description: 'Pagamento em 30 dias', is_active: true },
    { name: '60 dias', days: 60, description: 'Pagamento em 60 dias', is_active: true },
    { name: '90 dias', days: 90, description: 'Pagamento em 90 dias', is_active: true }
  ]

  await supabase.from('payment_terms').insert(paymentTerms)
}

async function createMasterUser(supabase: any) {
  console.log('Creating master user...')
  
  try {
    const { data: { user }, error } = await supabase.auth.admin.createUser({
      email: 'bapx@bapx.com.br',
      password: '123456',
      email_confirm: true
    })

    if (error) {
      console.error('Error creating master user:', error)
      throw error
    }

    if (user) {
      // Create master role for the user
      await supabase
        .from('user_roles')
        .insert([{ user_id: user.id, role: 'master' }])

      console.log('Master user created successfully')
    }
  } catch (error) {
    console.error('Failed to create master user:', error)
    // Don't throw error here as user creation might fail if user already exists
  }
}