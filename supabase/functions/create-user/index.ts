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
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { email, password, firstName, lastName, userType, moduleIds } = await req.json()

    console.log('Creating user:', { email, firstName, lastName, userType, moduleCount: moduleIds?.length })

    // Verificar se o usuário que está fazendo a requisição é admin
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      throw new Error('Authorization header missing')
    }

    const token = authHeader.replace('Bearer ', '')
    const { data: { user: requestingUser }, error: userError } = await supabaseClient.auth.getUser(token)

    if (userError || !requestingUser) {
      console.error('Error getting user:', userError)
      throw new Error('Invalid token')
    }

    console.log('Requesting user:', requestingUser.id)

    // Verificar se é admin - buscar na tabela user_roles
    const { data: adminCheck, error: adminError } = await supabaseClient
      .from('user_roles')
      .select('role')
      .eq('user_id', requestingUser.id)
      .maybeSingle()

    console.log('Admin check result:', adminCheck, 'Error:', adminError)

    if (adminError) {
      console.error('Error checking admin status:', adminError)
      throw new Error('Error checking permissions')
    }

    if (!adminCheck || adminCheck.role !== 'admin') {
      throw new Error('Permission denied: Only admins can create users')
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