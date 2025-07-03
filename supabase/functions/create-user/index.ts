
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { buildErrorResponse, buildSuccessResponse, corsHeaders } from "./responses.ts";
import { getRequesterContext } from "./getRequesterContext.ts";
import { createSupabaseUser } from "./createSupabaseUser.ts";
import { upsertUserProfile } from "./upsertUserProfile.ts";
import { insertUserRole } from "./insertUserRole.ts";
import { deleteSupabaseUser } from "./deleteSupabaseUser.ts";

serve(async (req) => {
  console.log("=== CREATE USER FUNCTION STARTED ===");
  console.log("Request method:", req.method);
  console.log("Request headers:", Object.fromEntries(req.headers.entries()));

  if (req.method === "OPTIONS") {
    console.log("Handling OPTIONS request");
    return new Response(null, { headers: corsHeaders });
  }
  
  if (req.method !== "POST") {
    console.log("Invalid method:", req.method);
    return buildErrorResponse("Método não permitido", 405);
  }

  try {
    console.log("=== ENVIRONMENT VALIDATION ===");
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
    
    console.log("Environment check:", { 
      hasUrl: !!supabaseUrl, 
      hasServiceKey: !!serviceRoleKey, 
      hasAnonKey: !!anonKey 
    });
    
    if (!supabaseUrl || !serviceRoleKey || !anonKey) {
      console.error("Missing environment variables");
      return buildErrorResponse("Configuração do servidor inválida", 500);
    }

    console.log("=== SUPABASE CLIENT INITIALIZATION ===");
    const supabaseServiceRole = createClient(supabaseUrl, serviceRoleKey);
    console.log("Supabase client created successfully");

    console.log("=== REQUEST DATA PARSING ===");
    const requestData = await req.json();
    console.log("Request data received:", {
      email: requestData.email ? "***@" + requestData.email.split('@')[1] : undefined,
      firstName: requestData.firstName,
      lastName: requestData.lastName,
      role: requestData.role,
      hasPassword: !!requestData.password,
      companyId: requestData.companyId,
      profileId: requestData.profileId
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

    console.log("=== FIELD VALIDATION ===");
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

    console.log("Sanitized data:", {
      email: sanitizedEmail,
      firstName: sanitizedFirstName,
      lastName: sanitizedLastName
    });

    // Validações básicas
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(sanitizedEmail)) {
      console.error("Invalid email format:", sanitizedEmail);
      return buildErrorResponse("Email inválido", 400);
    }

    if (password.length < 8) {
      console.error("Password too short:", password.length);
      return buildErrorResponse("Senha deve ter pelo menos 8 caracteres", 400);
    }

    console.log("=== AUTHENTICATION VALIDATION ===");
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      console.error("No authorization header");
      return buildErrorResponse("Token de autorização não fornecido", 401);
    }

    const token = authHeader.replace('Bearer ', '');
    console.log("Token extracted, length:", token.length);
    
    const { data: userData, error: userError } = await supabaseServiceRole.auth.getUser(token);
    
    if (userError || !userData.user) {
      console.error("Auth error:", userError);
      return buildErrorResponse("Token inválido ou usuário não encontrado", 401);
    }

    console.log("User authenticated:", userData.user.id);

    console.log("=== ROLE VERIFICATION ===");
    const { data: userRoles, error: roleError } = await supabaseServiceRole
      .from('user_roles')
      .select('role')
      .eq('user_id', userData.user.id);

    console.log("Role query result:", { userRoles, roleError });

    if (roleError) {
      console.error("Role verification error:", roleError);
      return buildErrorResponse("Erro ao verificar permissões do usuário.", 500);
    }

    if (!userRoles || userRoles.length === 0) {
      console.error("User has no roles assigned");
      return buildErrorResponse("Usuário não possui permissões atribuídas.", 403);
    }

    const hasAdminRole = userRoles.some(r => r.role === 'admin' || r.role === 'master');
    console.log("User roles:", userRoles.map(r => r.role));
    console.log("Has admin role:", hasAdminRole);
    
    if (!hasAdminRole) {
      console.error("User does not have admin/master role");
      return buildErrorResponse("Permissão negada. Apenas admin/master podem criar usuários.", 403);
    }

    console.log("=== COMPANY ID VALIDATION ===");
    let finalCompanyId = companyId;
    console.log("Provided company ID:", finalCompanyId);
    
    if (!finalCompanyId) {
      console.log("No company ID provided, getting from requester context");
      const requesterContext = await getRequesterContext(req, supabaseUrl, anonKey, supabaseServiceRole);
      if ("error" in requesterContext) {
        console.error("Error getting requester context:", requesterContext.error);
        return requesterContext.error;
      }
      finalCompanyId = requesterContext.companyId;
      console.log("Company ID from context:", finalCompanyId);
    }

    if (!finalCompanyId) {
      console.error("No company ID available");
      return buildErrorResponse("Company ID não disponível", 400);
    }

    console.log("Final company ID:", finalCompanyId);

    console.log("=== USER CREATION PROCESS ===");

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
