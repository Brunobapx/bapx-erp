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

    // Verificar se o usuário solicitante é admin/master
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      throw new Error('Token de autorização não encontrado');
    }

    const token = authHeader.replace('Bearer ', '')
    const { data: { user: requestingUser }, error: userError } = await supabaseClient.auth.getUser(token)

    if (userError || !requestingUser) {
      throw new Error('Token de autorização inválido');
    }

    // Verificar permissões
    const { data: adminCheck, error: adminError } = await supabaseClient
      .from('user_roles')
      .select('role')
      .eq('user_id', requestingUser.id)
      .maybeSingle()

    // Buscar company do solicitante
    const { data: reqProfile } = await supabaseClient
      .from('profiles')
      .select('company_id')
      .eq('id', requestingUser.id)
      .maybeSingle();

    const isMaster = adminCheck?.role === 'master';

    // Buscar todos os usuários do auth
    const { data: authUsers, error: authError } = await supabaseClient.auth.admin.listUsers()
    if (authError) {
      console.error('Error fetching auth users:', authError)
      throw new Error('Erro ao buscar usuários');
    }

    // Buscar perfis (para filtrar por empresa quando admin)
    const { data: profiles, error: profilesError } = await supabaseClient
      .from('profiles')
      .select('id, company_id');
    if (profilesError) {
      console.error('Error fetching profiles:', profilesError)
    }

    const allowedUserIds = new Set<string>(
      isMaster
        ? authUsers.users.map(u => u.id)
        : profiles?.filter(p => p.company_id && p.company_id === reqProfile?.company_id).map(p => p.id) || []
    );

    // Buscar roles e permissões apenas uma vez
    const { data: userRoles } = await supabaseClient
      .from('user_roles')
      .select('user_id, role');

    const { data: userPermissions } = await supabaseClient
      .from('user_module_permissions')
      .select(`
        user_id,
        system_modules (
          id,
          name,
          route_path
        )
      `);

    // Combinar dados
    const enrichedUsers = authUsers.users
      .filter(u => allowedUserIds.has(u.id))
      .map(authUser => {
        const userRole = userRoles?.find(role => role.user_id === authUser.id);
        const userModulePermissions = userPermissions?.filter((up: any) => up.user_id === authUser.id) || [];
        return {
          id: authUser.id,
          email: authUser.email,
          user_metadata: authUser.user_metadata || {},
          created_at: authUser.created_at,
          role: userRole?.role || 'user',
          modules: userModulePermissions.map((ump: any) => ump.system_modules?.name).filter(Boolean),
          moduleIds: userModulePermissions.map((ump: any) => ump.system_modules?.id).filter(Boolean)
        };
      });

    return new Response(
      JSON.stringify({ success: true, users: enrichedUsers }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    )

  } catch (error: any) {
    console.error('Error in get-users function:', error)
    
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