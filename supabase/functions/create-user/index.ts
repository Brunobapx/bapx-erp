
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { buildErrorResponse, buildSuccessResponse, corsHeaders } from "./responses.ts";
import { getRequesterContext } from "./getRequesterContext.ts";
import { createSupabaseUser } from "./createSupabaseUser.ts";
import { upsertUserProfile } from "./upsertUserProfile.ts";
import { insertUserRole } from "./insertUserRole.ts";
import { deleteSupabaseUser } from "./deleteSupabaseUser.ts";

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }
  if (req.method !== "POST") {
    return buildErrorResponse("Método não permitido", 405);
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
    if (!supabaseUrl || !serviceRoleKey || !anonKey) {
      return buildErrorResponse("Configuração do servidor inválida", 500);
    }

    const requestData = await req.json();
    const { email, password, profile_id, company_id, firstName, lastName } = requestData;
    if (!email || !password || !profile_id || !company_id) {
      return buildErrorResponse("Email, senha, perfil e empresa são obrigatórios", 400);
    }

    const requesterRole = req.headers.get("x-requester-role");
    if (requesterRole !== "admin" && requesterRole !== "master") {
      return buildErrorResponse("Permissão negada. Apenas admin/master podem criar usuários.", 403);
    }

    const supabaseServiceRole = createClient(supabaseUrl, serviceRoleKey);

    const requesterContext = await getRequesterContext(req, supabaseUrl, anonKey, supabaseServiceRole);
    if ("error" in requesterContext) return requesterContext.error;

    const newUserResult = await createSupabaseUser(supabaseServiceRole, email, password);
    if ("error" in newUserResult) return newUserResult.error;
    const newUserId = newUserResult.user.id;

    // Criar perfil do usuário com profile_id
    const profileCreateError = await upsertUserProfile(
      supabaseServiceRole, 
      newUserId, 
      company_id, 
      profile_id,
      firstName,
      lastName
    );
    if (profileCreateError) {
      await deleteSupabaseUser(supabaseServiceRole, newUserId);
      return buildErrorResponse("Erro ao criar perfil do usuário: " + profileCreateError.message, 500);
    }

    // Criar role baseada no perfil (usuário comum por padrão)
    const roleCreateError = await insertUserRole(supabaseServiceRole, newUserId, 'user', company_id);
    if (roleCreateError) {
      await deleteSupabaseUser(supabaseServiceRole, newUserId);
      return buildErrorResponse("Erro ao definir função do usuário: " + roleCreateError.message, 500);
    }

    return buildSuccessResponse({
      success: true,
      user: newUserResult.user,
      company_id: company_id,
      profile_id: profile_id,
      message: "Usuário criado com sucesso e associado à empresa!"
    });
  } catch (error) {
    return buildErrorResponse("Erro interno do servidor: " + (error?.message || "Erro desconhecido"), 500);
  }
});
