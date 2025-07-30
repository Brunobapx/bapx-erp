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
      console.error('Missing environment variables');
      throw new Error('Configuração do servidor incompleta');
    }

    const supabaseClient = createClient(supabaseUrl, serviceRoleKey)

    const requestBody = await req.json();
    const { userId, updates, moduleIds } = requestBody;

    console.log('Updating user:', { userId, updates, moduleIds })
    console.log('Request body:', requestBody)

    // Verificar autorização
    const authHeader = req.headers.get('Authorization')
    console.log('Auth header:', authHeader ? 'Present' : 'Missing')
    
    if (!authHeader) {
      throw new Error('Token de autorização não encontrado');
    }

    const token = authHeader.replace('Bearer ', '')
    console.log('Token extracted, attempting to get user...')
    
    const { data: { user: requestingUser }, error: userError } = await supabaseClient.auth.getUser(token)
    
    console.log('Auth user result:', { user: requestingUser?.id, error: userError })

    if (userError || !requestingUser) {
      console.error('Auth error:', userError)
      throw new Error('Token de autorização inválido');
    }

    // Verificar se é admin/master ou o próprio usuário
    console.log('Checking admin status for user:', requestingUser.id)
    const { data: adminCheck, error: adminError } = await supabaseClient
      .from('user_roles')
      .select('role')
      .eq('user_id', requestingUser.id)
      .maybeSingle()

    console.log('Admin check result:', { adminCheck, adminError })

    const isAdmin = adminCheck && ['admin', 'master'].includes(adminCheck.role);
    const isSelfUpdate = requestingUser.id === userId;
    
    console.log('Permission check:', { isAdmin, isSelfUpdate, requestingUserId: requestingUser.id, targetUserId: userId })

    if (!isAdmin && !isSelfUpdate) {
      throw new Error('Permissão negada');
    }

    // Atualizar dados do usuário no auth se fornecidos
    if (updates && Object.keys(updates).length > 0) {
      const authUpdates: any = {};

      if (updates.email) {
        authUpdates.email = updates.email;
      }

      if (updates.password) {
        authUpdates.password = updates.password;
      }

      if (updates.user_metadata) {
        authUpdates.user_metadata = updates.user_metadata;
      }

      if (Object.keys(authUpdates).length > 0) {
        const { error: updateError } = await supabaseClient.auth.admin.updateUserById(
          userId,
          authUpdates
        );

        if (updateError) {
          console.error('Error updating user:', updateError)
          throw new Error('Erro ao atualizar usuário');
        }
      }
    }

    // Atualizar permissões de módulos (apenas admins)
    if (isAdmin && moduleIds !== undefined) {
      // Deletar permissões existentes
      await supabaseClient
        .from('user_module_permissions')
        .delete()
        .eq('user_id', userId);

      // Inserir novas permissões
      if (moduleIds.length > 0) {
        const modulePermissions = moduleIds.map((moduleId: string) => ({
          user_id: userId,
          module_id: moduleId
        }));

        const { error: permissionsError } = await supabaseClient
          .from('user_module_permissions')
          .insert(modulePermissions);

        if (permissionsError) {
          console.error('Error updating module permissions:', permissionsError)
          throw new Error('Erro ao atualizar permissões de módulos');
        }
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Usuário atualizado com sucesso!'
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    )

  } catch (error: any) {
    console.error('Error in update-user function:', error)
    
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