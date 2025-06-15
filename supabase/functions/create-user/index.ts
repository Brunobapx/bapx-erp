
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-requester-role",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

// --- Funções auxiliares ---
function buildErrorResponse(message: string, status = 400) {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function buildSuccessResponse(data: Record<string, unknown>) {
  return new Response(JSON.stringify(data), {
    status: 200,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

async function getRequesterContext(req: Request, supabaseUrl: string, anonKey: string, supabaseServiceRole: any) {
  // Retorna userId e companyId do solicitante autenticado
  const authHeader = req.headers.get("authorization");
  if (!authHeader) return { error: buildErrorResponse("Token de autorização não fornecido", 401) };

  // Cliente Supabase com token do usuário
  const supabaseUser = createClient(supabaseUrl, anonKey, {
    global: {
      headers: {
        Authorization: authHeader,
      },
    },
  });

  // Buscar userId do solicitante autenticado
  const { data: userData, error: userError } = await supabaseUser.auth.getUser();
  if (userError || !userData.user) {
    return { error: buildErrorResponse("Usuário não autenticado", 401) };
  }

  const requesterId = userData.user.id;

  // Buscar company_id do solicitante
  const { data: requesterProfile, error: profileError } = await supabaseServiceRole
    .from('profiles')
    .select('company_id')
    .eq('id', requesterId)
    .single();

  if (profileError || !requesterProfile?.company_id) {
    return { error: buildErrorResponse("Não foi possível obter dados da empresa do usuário solicitante") };
  }

  const companyId = requesterProfile.company_id;
  if (!companyId) {
    return { error: buildErrorResponse("Impossível associar usuário sem empresa definida. Entre em contato com o suporte.") };
  }

  return { requesterId, companyId };
}

async function createSupabaseUser(supabaseServiceRole: any, email: string, password: string) {
  const { data: newUserData, error: createUserError } = await supabaseServiceRole.auth.admin.createUser({
    email: email.trim(),
    password,
    email_confirm: true,
  });

  if (createUserError || !newUserData.user) {
    return { error: buildErrorResponse(createUserError?.message || "Erro ao criar usuário na autenticação") };
  }

  return { user: newUserData.user };
}

async function upsertUserProfile(supabaseServiceRole: any, userId: string, companyId: string) {
  const { error } = await supabaseServiceRole
    .from('profiles')
    .upsert({ 
      id: userId, 
      company_id: companyId,
      is_active: true,
      first_name: '',
      last_name: ''
    });
  return error;
}

async function insertUserRole(supabaseServiceRole: any, userId: string, role: string, companyId: string) {
  const { error } = await supabaseServiceRole
    .from('user_roles')
    .insert({ 
      user_id: userId, 
      role,
      company_id: companyId
    });
  return error;
}

async function deleteSupabaseUser(supabaseServiceRole: any, userId: string) {
  await supabaseServiceRole.auth.admin.deleteUser(userId);
}

// --- Handler principal ---
serve(async (req) => {
  console.log(`Método: ${req.method}, URL: ${req.url}`);
  
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return buildErrorResponse("Método não permitido", 405);
  }

  try {
    console.log("Iniciando criação de usuário...");

    // Checagem rápida de variáveis de ambiente
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
    if (!supabaseUrl || !serviceRoleKey || !anonKey) {
      console.error("Variáveis de ambiente faltando");
      return buildErrorResponse("Configuração do servidor inválida", 500);
    }

    // Parse e validação básica dos dados
    const requestData = await req.json();
    console.log("Dados recebidos:", JSON.stringify(requestData, null, 2));
    const { email, password, role } = requestData;
    if (!email || !password || !role) {
      return buildErrorResponse("Email, senha e função são obrigatórios", 400);
    }

    // Checa permissão do solicitante
    const requesterRole = req.headers.get("x-requester-role");
    console.log("Role do solicitante:", requesterRole);
    if (requesterRole !== "admin" && requesterRole !== "master") {
      return buildErrorResponse("Permissão negada. Apenas admin/master podem criar usuários.", 403);
    }

    // Inicialização do Supabase service role client
    const supabaseServiceRole = createClient(supabaseUrl, serviceRoleKey);

    // Buscar contexto do solicitante (userId e companyId)
    const requesterContext = await getRequesterContext(req, supabaseUrl, anonKey, supabaseServiceRole);
    if ("error" in requesterContext) {
      return requesterContext.error;
    }
    const { requesterId, companyId } = requesterContext;
    console.log("ID do usuário solicitante:", requesterId, "| company_id:", companyId);

    // Criação do novo usuário no Auth
    const newUserResult = await createSupabaseUser(supabaseServiceRole, email, password);
    if ("error" in newUserResult) {
      return newUserResult.error;
    }
    const newUserId = newUserResult.user.id;
    console.log("Usuário criado com ID:", newUserId);

    // Criar perfil associado à empresa correta
    const profileCreateError = await upsertUserProfile(supabaseServiceRole, newUserId, companyId);
    if (profileCreateError) {
      console.error("Erro ao criar perfil:", profileCreateError);
      await deleteSupabaseUser(supabaseServiceRole, newUserId);
      return buildErrorResponse("Erro ao criar perfil do usuário: " + profileCreateError.message, 500);
    }

    // Criar role na empresa
    const roleCreateError = await insertUserRole(supabaseServiceRole, newUserId, role, companyId);
    if (roleCreateError) {
      console.error("Erro ao definir role:", roleCreateError);
      await deleteSupabaseUser(supabaseServiceRole, newUserId);
      return buildErrorResponse("Erro ao definir função do usuário: " + roleCreateError.message, 500);
    }

    console.log("Usuário criado e associado corretamente ao company_id:", companyId);
    return buildSuccessResponse({ 
      success: true, 
      user: newUserResult.user,
      company_id: companyId,
      message: "Usuário criado com sucesso e associado à empresa!"
    });

  } catch (error) {
    console.error("Erro geral:", error);
    return buildErrorResponse("Erro interno do servidor: " + (error?.message || "Erro desconhecido"), 500);
  }
});
