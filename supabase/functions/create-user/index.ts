import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Verificar se as variáveis de ambiente estão configuradas
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !serviceRoleKey) {
      console.error('Missing environment variables:', { 
        hasUrl: !!supabaseUrl, 
        hasServiceKey: !!serviceRoleKey 
      });
      throw new Error('Configuração do servidor incompleta');
    }

    const supabaseClient = createClient(supabaseUrl, serviceRoleKey)

    const requestBody = await req.json();
    const { email, password, firstName, lastName, userType, position, moduleIds } = requestBody;

    console.log('Creating user request:', { 
      email, 
      firstName, 
      lastName, 
      userType, 
      moduleCount: moduleIds?.length,
      hasPassword: !!password
    })

    // Validação dos dados de entrada
    if (!email || !email.includes('@')) {
      throw new Error('Email inválido');
    }

    if (!password || password.length < 6) {
      throw new Error('Senha deve ter pelo menos 6 caracteres');
    }

    if (!firstName || !lastName) {
      throw new Error('Nome e sobrenome são obrigatórios');
    }

    if (!userType || !['admin', 'user'].includes(userType)) {
      throw new Error('Tipo de usuário inválido');
    }

    // Verificar se o usuário que está fazendo a requisição é admin/master
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      console.error('No authorization header found');
      throw new Error('Token de autorização não encontrado');
    }

    const token = authHeader.replace('Bearer ', '')
    const { data: { user: requestingUser }, error: userError } = await supabaseClient.auth.getUser(token)

    if (userError || !requestingUser) {
      console.error('Error getting requesting user:', userError)
      throw new Error('Token de autorização inválido');
    }

    console.log('Requesting user ID:', requestingUser.id)

    // Verificar se é admin ou master - buscar na tabela user_roles
    const { data: adminCheck, error: adminError } = await supabaseClient
      .from('user_roles')
      .select('role')
      .eq('user_id', requestingUser.id)
      .maybeSingle()

    console.log('Admin check result:', adminCheck, 'Error:', adminError)

    if (adminError) {
      console.error('Error checking admin status:', adminError)
      throw new Error('Erro ao verificar permissões');
    }

    if (!adminCheck || !['admin', 'master'].includes(adminCheck.role)) {
      console.error('Permission denied for user:', requestingUser.id, 'Role:', adminCheck?.role);
      throw new Error('Permissão negada: Apenas administradores podem criar usuários');
    }

    // Criar usuário no auth
    const { data: newUser, error: createError } = await supabaseClient.auth.admin.createUser({
      email,
      password,
      user_metadata: {
        first_name: firstName,
        last_name: lastName
      },
      email_confirm: true // Auto-confirmar email para evitar problemas
    })

    if (createError) {
      console.error('Error creating user:', createError)
      throw createError
    }

    if (!newUser.user) {
      throw new Error('Failed to create user')
    }

    console.log('User created in auth:', newUser.user.id)

    // Descobrir a empresa do solicitante
    const { data: reqProfile } = await supabaseClient
      .from('profiles')
      .select('company_id')
      .eq('id', requestingUser.id)
      .maybeSingle()

    // Criar/atualizar perfil do novo usuário, vinculando à mesma empresa do solicitante
    const { error: profileError } = await supabaseClient
      .from('profiles')
      .upsert({
        id: newUser.user.id,
        first_name: firstName,
        last_name: lastName,
        company_id: reqProfile?.company_id ?? null
      })

    if (profileError) {
      console.error('Error upserting profile for new user:', profileError)
      throw profileError
    }

    // Criar role do usuário
    const { error: roleError } = await supabaseClient
      .from('user_roles')
      .insert({
        user_id: newUser.user.id,
        role: userType || 'user'
      })

    if (roleError) {
      console.error('Error creating user role:', roleError)
      throw roleError
    }

    console.log('User role created:', userType)

    // Criar cargo do usuário se fornecido
    if (position) {
      const { error: positionError } = await supabaseClient
        .from('user_positions')
        .insert({
          user_id: newUser.user.id,
          position: position
        })

      if (positionError) {
        console.error('Error creating user position:', positionError)
        throw positionError
      }

      console.log('User position created:', position)
    }

    // Criar permissões de módulos se fornecidas
    if (moduleIds && moduleIds.length > 0) {
      const modulePermissions = moduleIds.map((moduleId: string) => ({
        user_id: newUser.user.id,
        module_id: moduleId
      }))

      const { error: permissionsError } = await supabaseClient
        .from('user_module_permissions')
        .insert(modulePermissions)

      if (permissionsError) {
        console.error('Error creating module permissions:', permissionsError)
        throw permissionsError
      }

      console.log('Module permissions created:', moduleIds.length)
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        user: newUser.user,
        message: 'Usuário criado com sucesso!'
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    )

  } catch (error) {
    console.error('Error in create-user function:', error)
    
    return new Response(
      JSON.stringify({ 
        error: error.message || 'Erro interno do servidor' 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400 
      }
    )
  }
})