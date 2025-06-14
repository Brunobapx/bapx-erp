
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
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    // Criar usuário via Auth API
    console.log("Criando usuário...");
    const { data: userData, error: userError } = await supabase.auth.admin.createUser({
      email: email.trim(),
      password,
      email_confirm: true,
    });

    if (userError || !userData.user) {
      console.error("Erro ao criar usuário:", userError);
      return new Response(JSON.stringify({ 
        error: userError?.message || "Erro ao criar usuário na autenticação" 
      }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userId = userData.user.id;
    console.log("Usuário criado com ID:", userId);

    // Criar ou atualizar perfil
    console.log("Criando perfil...");
    const { error: profileError } = await supabase
      .from('profiles')
      .upsert({ 
        id: userId, 
        is_active: true,
        first_name: '',
        last_name: ''
      });

    if (profileError) {
      console.error("Erro ao criar perfil:", profileError);
      // Não retornar erro aqui, pois o usuário já foi criado
    }

    // Criar role
    console.log("Definindo role...");
    const { error: roleError } = await supabase
      .from('user_roles')
      .insert({ 
        user_id: userId, 
        role: role 
      });

    if (roleError) {
      console.error("Erro ao definir role:", roleError);
      // Não retornar erro aqui, pois o usuário já foi criado
    }

    console.log("Usuário criado com sucesso!");

    return new Response(JSON.stringify({ 
      success: true, 
      user: userData.user,
      message: "Usuário criado com sucesso!" 
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
