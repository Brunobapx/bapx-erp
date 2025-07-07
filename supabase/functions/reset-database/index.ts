import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !serviceRoleKey) {
      throw new Error('Configuração do servidor incompleta');
    }

    const supabaseClient = createClient(supabaseUrl, serviceRoleKey)

    console.log('Starting database reset process...')

    // 1. Buscar todos os usuários existentes
    const { data: existingUsers, error: listError } = await supabaseClient.auth.admin.listUsers()
    
    if (listError) {
      console.error('Error listing users:', listError)
      throw new Error('Erro ao listar usuários existentes')
    }

    console.log(`Found ${existingUsers.users.length} existing users`)

    // 2. Deletar todos os usuários existentes
    for (const user of existingUsers.users) {
      console.log(`Deleting user: ${user.email} (${user.id})`)
      
      // Deletar permissões de módulos
      await supabaseClient
        .from('user_module_permissions')
        .delete()
        .eq('user_id', user.id)

      // Deletar role
      await supabaseClient
        .from('user_roles')
        .delete()
        .eq('user_id', user.id)

      // Deletar usuário do auth
      const { error: deleteError } = await supabaseClient.auth.admin.deleteUser(user.id)
      if (deleteError) {
        console.error(`Error deleting user ${user.id}:`, deleteError)
      }
    }

    console.log('All users deleted successfully')

    // 3. Criar o usuário master
    console.log('Creating master user...')
    
    const { data: newUser, error: createError } = await supabaseClient.auth.admin.createUser({
      email: 'bapx@bapx.com.br',
      password: '123456',
      user_metadata: {
        first_name: 'Master',
        last_name: 'BAPX'
      },
      email_confirm: true
    })

    if (createError) {
      console.error('Error creating master user:', createError)
      throw createError
    }

    if (!newUser.user) {
      throw new Error('Failed to create master user')
    }

    console.log('Master user created:', newUser.user.id)

    // 4. Criar role master
    const { error: roleError } = await supabaseClient
      .from('user_roles')
      .insert({
        user_id: newUser.user.id,
        role: 'master'
      })

    if (roleError) {
      console.error('Error creating master role:', roleError)
      throw roleError
    }

    console.log('Master role created successfully')

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Banco de dados resetado com sucesso! Usuário master criado.',
        masterUser: {
          id: newUser.user.id,
          email: 'bapx@bapx.com.br',
          role: 'master'
        }
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    )

  } catch (error: any) {
    console.error('Error in reset-database function:', error)
    
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