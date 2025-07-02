
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
      console.error("Missing environment variables:", { supabaseUrl: !!supabaseUrl, serviceRoleKey: !!serviceRoleKey, anonKey: !!anonKey });
      return buildErrorResponse("Configuração do servidor inválida", 500);
    }

    const requestData = await req.json();
    console.log("Request data received (sanitized):", {
      email: requestData.email ? "***" : undefined,
      firstName: requestData.firstName,
      lastName: requestData.lastName,
      role: requestData.role,
      hasPassword: !!requestData.password,
      companyId: requestData.companyId
    });
    
    const { 
      email, 
      password, 
      firstName, 
      lastName, 
      profileId,
      role = 'user',
      department,
      position,
      companyId 
    } = requestData;

    // Validação de campos obrigatórios
    if (!email || !password || !firstName || !lastName) {
      console.error("Missing required fields:", { 
        email: !!email, 
        password: !!password, 
        firstName: !!firstName, 
        lastName: !!lastName 
      });
      return buildErrorResponse("Email, senha, nome e sobrenome são obrigatórios", 400);
    }

    // Sanitizar dados de entrada
    const sanitizedEmail = email.trim().toLowerCase();
    const sanitizedFirstName = firstName.trim();
    const sanitizedLastName = lastName.trim();

    // Validações básicas
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(sanitizedEmail)) {
      return buildErrorResponse("Email inválido", 400);
    }

    if (password.length < 8) {
      return buildErrorResponse("Senha deve ter pelo menos 8 caracteres", 400);
    }

    // Verificar autorização do usuário via token JWT
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      return buildErrorResponse("Token de autorização não fornecido", 401);
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: userData, error: userError } = await supabaseServiceRole.auth.getUser(token);
    
    if (userError || !userData.user) {
      return buildErrorResponse("Token inválido ou usuário não encontrado", 401);
    }

    // Verificar role do usuário solicitante
    const { data: userRole, error: roleError } = await supabaseServiceRole
      .from('user_roles')
      .select('role')
      .eq('user_id', userData.user.id)
      .single();

    if (roleError || !userRole || (userRole.role !== 'admin' && userRole.role !== 'master')) {
      return buildErrorResponse("Permissão negada. Apenas admin/master podem criar usuários.", 403);
    }

    const supabaseServiceRole = createClient(supabaseUrl, serviceRoleKey);

    // Se companyId não foi fornecido, obter do contexto do solicitante
    let finalCompanyId = companyId;
    if (!finalCompanyId) {
      const requesterContext = await getRequesterContext(req, supabaseUrl, anonKey, supabaseServiceRole);
      if ("error" in requesterContext) {
        console.error("Error getting requester context:", requesterContext.error);
        return requesterContext.error;
      }
      finalCompanyId = requesterContext.companyId;
    }

    if (!finalCompanyId) {
      return buildErrorResponse("Company ID não disponível", 400);
    }

    console.log("Creating user with company ID:", finalCompanyId);

    // Criar usuário no Supabase Auth
    const newUserResult = await createSupabaseUser(supabaseServiceRole, sanitizedEmail, password);
    if ("error" in newUserResult) {
      console.error("Error creating user:", newUserResult.error);
      return newUserResult.error;
    }
    const newUserId = newUserResult.user.id;
    console.log("User created with ID:", newUserId);

    // Criar perfil do usuário
    const profileCreateError = await upsertUserProfile(
      supabaseServiceRole, 
      newUserId, 
      finalCompanyId, 
      profileId || null,
      sanitizedFirstName,
      sanitizedLastName,
      department?.trim() || null,
      position?.trim() || null
    );
    
    if (profileCreateError) {
      console.error("Error creating profile:", profileCreateError);
      await deleteSupabaseUser(supabaseServiceRole, newUserId);
      return buildErrorResponse("Erro ao criar perfil do usuário: " + (profileCreateError.message || "Erro desconhecido"), 500);
    }

    console.log("Profile created successfully");

    // Criar/atualizar role do usuário
    const roleCreateError = await insertUserRole(supabaseServiceRole, newUserId, role, finalCompanyId);
    if (roleCreateError) {
      console.error("Error creating/updating role:", roleCreateError);
      
      // Se for erro de constraint única, não é crítico - continuar
      if (roleCreateError.code === '23505' && roleCreateError.message?.includes('user_roles_user_id_role_key')) {
        console.log("User role already exists, continuing...");
      } else {
        await deleteSupabaseUser(supabaseServiceRole, newUserId);
        return buildErrorResponse("Erro ao definir função do usuário: " + (roleCreateError.message || "Erro desconhecido"), 500);
      }
    }

    console.log("User role created/updated successfully");

    return buildSuccessResponse({
      success: true,
      user: {
        id: newUserId,
        email: email,
        firstName: firstName,
        lastName: lastName,
        role: role
      },
      company_id: finalCompanyId,
      profile_id: profileId,
      message: "Usuário criado com sucesso!"
    });
    
  } catch (error) {
    console.error("Unexpected error in create-user function:", error);
    return buildErrorResponse("Erro interno do servidor: " + (error?.message || "Erro desconhecido"), 500);
  }
});
