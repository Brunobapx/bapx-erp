
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { buildErrorResponse, buildSuccessResponse, corsHeaders } from "./responses.ts";
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

    // Usar o cliente com service role para operações administrativas
    const supabaseServiceRole = createClient(supabaseUrl, serviceRoleKey);
    
    // Usar o cliente anônimo para validar o token JWT do usuário solicitante
    const authHeader = req.headers.get("authorization");
    if (!authHeader) {
      return buildErrorResponse("Token de autorização não fornecido", 401);
    }

    const supabaseUser = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } }
    });

    // Validar o usuário autenticado
    const { data: userData, error: userError } = await supabaseUser.auth.getUser();
    if (userError || !userData.user) {
      return buildErrorResponse("Usuário não autenticado", 401);
    }

    const requesterId = userData.user.id;

    // Verificar se o usuário tem permissão para criar usuários
    const { data: requesterRole, error: roleError } = await supabaseServiceRole
      .from('user_roles')
      .select('role, company_id')
      .eq('user_id', requesterId)
      .single();

    if (roleError || !requesterRole) {
      return buildErrorResponse("Não foi possível verificar permissões do usuário", 403);
    }

    if (requesterRole.role !== "admin" && requesterRole.role !== "master") {
      // Log tentativa de acesso não autorizado
      await supabaseServiceRole.rpc('log_security_event', {
        action_name: 'UNAUTHORIZED_USER_CREATION_ATTEMPT',
        table_name: 'auth.users',
        record_id: null,
        old_data: null,
        new_data: { requester_id: requesterId, attempted_role: requesterRole.role }
      });
      
      return buildErrorResponse("Permissão negada. Apenas admin/master podem criar usuários.", 403);
    }

    const requestData = await req.json();
    const { email, password, role } = requestData;
    
    if (!email || !password || !role) {
      return buildErrorResponse("Email, senha e função são obrigatórios", 400);
    }

    // Validar formato do email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return buildErrorResponse("Formato de email inválido", 400);
    }

    // Validar força da senha
    if (password.length < 8) {
      return buildErrorResponse("Senha deve ter pelo menos 8 caracteres", 400);
    }

    const companyId = requesterRole.company_id;

    const newUserResult = await createSupabaseUser(supabaseServiceRole, email, password);
    if ("error" in newUserResult) return newUserResult.error;
    const newUserId = newUserResult.user.id;

    try {
      const profileCreateError = await upsertUserProfile(supabaseServiceRole, newUserId, companyId);
      if (profileCreateError) {
        await deleteSupabaseUser(supabaseServiceRole, newUserId);
        return buildErrorResponse("Erro ao criar perfil do usuário: " + profileCreateError.message, 500);
      }

      const roleCreateError = await insertUserRole(supabaseServiceRole, newUserId, role, companyId);
      if (roleCreateError) {
        await deleteSupabaseUser(supabaseServiceRole, newUserId);
        return buildErrorResponse("Erro ao definir função do usuário: " + roleCreateError.message, 500);
      }

      // Log criação de usuário bem-sucedida
      await supabaseServiceRole.rpc('log_security_event', {
        action_name: 'USER_CREATED_SUCCESS',
        table_name: 'auth.users',
        record_id: newUserId,
        old_data: null,
        new_data: { 
          created_by: requesterId, 
          email: email, 
          role: role, 
          company_id: companyId 
        }
      });

      return buildSuccessResponse({
        success: true,
        user: { id: newUserId, email: email },
        company_id: companyId,
        message: "Usuário criado com sucesso e associado à empresa!"
      });

    } catch (error) {
      // Log erro na criação
      await supabaseServiceRole.rpc('log_security_event', {
        action_name: 'USER_CREATION_ERROR',
        table_name: 'auth.users',
        record_id: newUserId,
        old_data: null,
        new_data: { 
          created_by: requesterId, 
          error: error?.message || "Erro desconhecido" 
        }
      });

      await deleteSupabaseUser(supabaseServiceRole, newUserId);
      throw error;
    }

  } catch (error) {
    console.error("Erro na função create-user:", error);
    return buildErrorResponse("Erro interno do servidor: " + (error?.message || "Erro desconhecido"), 500);
  }
});
