
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-requester-role',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(
      JSON.stringify({ error: "Método não permitido" }),
      { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    
    if (!supabaseUrl || !serviceRoleKey) {
      throw new Error("Configuração do servidor inválida");
    }

    const supabaseServiceRole = createClient(supabaseUrl, serviceRoleKey);
    
    const { userId } = await req.json();
    const requesterRole = req.headers.get("x-requester-role");

    // Verificar permissões
    if (requesterRole !== "admin" && requesterRole !== "master") {
      return new Response(
        JSON.stringify({ error: "Permissão negada. Apenas admin/master podem excluir usuários." }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!userId) {
      return new Response(
        JSON.stringify({ error: "ID do usuário é obrigatório" }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`[delete-user] Iniciando exclusão do usuário: ${userId}`);

    // 1. Deletar registros relacionados na ordem correta
    console.log(`[delete-user] Removendo dados relacionados...`);
    
    // Deletar das tabelas que referenciam o usuário
    await supabaseServiceRole.from('user_roles').delete().eq('user_id', userId);
    await supabaseServiceRole.from('profiles').delete().eq('id', userId);
    
    // 2. Deletar usuário do auth usando admin API
    console.log(`[delete-user] Deletando usuário do auth...`);
    const { error: deleteError } = await supabaseServiceRole.auth.admin.deleteUser(userId);

    if (deleteError) {
      console.error('Erro ao deletar usuário do auth:', deleteError);
      throw deleteError;
    }

    console.log(`[delete-user] Usuário ${userId} excluído com sucesso`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Usuário excluído com sucesso!" 
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('Erro ao excluir usuário:', error);
    
    return new Response(
      JSON.stringify({ 
        error: error.message || "Erro interno do servidor" 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
