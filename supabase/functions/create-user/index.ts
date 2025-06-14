
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-requester-role",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

serve(async (req) => {
  console.log(`Método: ${req.method}, URL: ${req.url}`);
  
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Método não permitido" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    console.log("Iniciando criação de usuário...");
    
    const requestData = await req.json();
    console.log("Dados recebidos:", JSON.stringify(requestData, null, 2));
    
    const { email, password, role } = requestData;

    if (!email || !password || !role) {
      return new Response(JSON.stringify({ error: "Email, senha e função são obrigatórios" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Verificar permissão
    const requesterRole = req.headers.get("x-requester-role");
    console.log("Role do solicitante:", requesterRole);
    
    if (requesterRole !== "admin" && requesterRole !== "master") {
      return new Response(JSON.stringify({ error: "Permissão negada. Apenas admin/master podem criar usuários." }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !serviceRoleKey) {
      console.error("Variáveis de ambiente não configuradas");
      return new Response(JSON.stringify({ error: "Configuração do servidor inválida" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log("Configuração Supabase OK");

    // Criar cliente Supabase com service role
    const supabaseServiceRole = createClient(supabaseUrl, serviceRoleKey);

    // Obter o company_id do usuário solicitante usando o token de autorização
    const authHeader = req.headers.get("authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Token de autorização não fornecido" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Criar cliente com token do usuário para obter dados do solicitante
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
    if (!anonKey) {
      console.error("SUPABASE_ANON_KEY não configurada");
      return new Response(JSON.stringify({ error: "Configuração do servidor inválida" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUser = createClient(supabaseUrl, anonKey, {
      global: {
        headers: {
          Authorization: authHeader,
        },
      },
    });

    // Obter dados do usuário atual
    console.log("Obtendo dados do usuário solicitante...");
    const { data: userData, error: userError } = await supabaseUser.auth.getUser();
    
    if (userError || !userData.user) {
      console.error("Erro ao obter usuário:", userError);
      return new Response(JSON.stringify({ error: "Usuário não autenticado" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const requesterId = userData.user.id;
    console.log("ID do usuário solicitante:", requesterId);

    // Obter company_id do usuário solicitante
    console.log("Obtendo company_id do usuário solicitante...");
    const { data: requesterProfile, error: profileError } = await supabaseServiceRole
      .from('profiles')
      .select('company_id')
      .eq('id', requesterId)
      .single();

    if (profileError || !requesterProfile?.company_id) {
      console.error("Erro ao obter company_id do solicitante:", profileError);
      return new Response(JSON.stringify({ error: "Não foi possível obter dados da empresa do usuário" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const companyId = requesterProfile.company_id;
    console.log("Company ID obtido:", companyId);

    // Criar usuário via Auth API
    console.log("Criando usuário...");
    const { data: newUserData, error: createUserError } = await supabaseServiceRole.auth.admin.createUser({
      email: email.trim(),
      password,
      email_confirm: true,
    });

    if (createUserError || !newUserData.user) {
      console.error("Erro ao criar usuário:", createUserError);
      return new Response(JSON.stringify({ 
        error: createUserError?.message || "Erro ao criar usuário na autenticação" 
      }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const newUserId = newUserData.user.id;
    console.log("Usuário criado com ID:", newUserId);

    // Criar perfil com o company_id correto
    console.log("Criando perfil com company_id:", companyId);
    const { error: profileCreateError } = await supabaseServiceRole
      .from('profiles')
      .upsert({ 
        id: newUserId, 
        company_id: companyId,
        is_active: true,
        first_name: '',
        last_name: ''
      });

    if (profileCreateError) {
      console.error("Erro ao criar perfil:", profileCreateError);
      return new Response(JSON.stringify({ 
        error: "Erro ao criar perfil do usuário: " + profileCreateError.message 
      }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Criar role com o company_id correto
    console.log("Definindo role com company_id:", companyId);
    const { error: roleCreateError } = await supabaseServiceRole
      .from('user_roles')
      .insert({ 
        user_id: newUserId, 
        role: role,
        company_id: companyId
      });

    if (roleCreateError) {
      console.error("Erro ao definir role:", roleCreateError);
      return new Response(JSON.stringify({ 
        error: "Erro ao definir função do usuário: " + roleCreateError.message 
      }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log("Usuário criado com sucesso na empresa:", companyId);

    return new Response(JSON.stringify({ 
      success: true, 
      user: newUserData.user,
      company_id: companyId,
      message: "Usuário criado com sucesso e associado à empresa!" 
    }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("Erro geral:", error);
    return new Response(JSON.stringify({ 
      error: "Erro interno do servidor: " + (error?.message || "Erro desconhecido") 
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
