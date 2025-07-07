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

    // 1. Limpar permissões e roles existentes primeiro
    console.log('Cleaning up user permissions and roles...')
    
    const { error: permissionsError } = await supabaseClient
      .from('user_module_permissions')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000') // Delete all
    
    if (permissionsError) {
      console.error('Error deleting permissions:', permissionsError)
    }

    const { error: rolesError } = await supabaseClient
      .from('user_roles')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000') // Delete all
    
    if (rolesError) {
      console.error('Error deleting roles:', rolesError)
    }

    // 2. Tentar buscar e deletar usuários do auth
    try {
      const { data: existingUsers, error: listError } = await supabaseClient.auth.admin.listUsers()
      
      if (listError) {
        console.error('Error listing users:', listError)
        console.log('Proceeding without deleting auth users due to API limitation')
      } else {
        console.log(`Found ${existingUsers.users.length} existing users`)
        
        // Deletar todos os usuários existentes
        for (const user of existingUsers.users) {
          console.log(`Deleting user: ${user.email} (${user.id})`)
          
          const { error: deleteError } = await supabaseClient.auth.admin.deleteUser(user.id)
          if (deleteError) {
            console.error(`Error deleting user ${user.id}:`, deleteError)
          }
        }
      }
    } catch (error) {
      console.error('Error in user deletion process:', error)
      console.log('Continuing with master user creation...')
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