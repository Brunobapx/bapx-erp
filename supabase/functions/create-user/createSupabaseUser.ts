
import { buildErrorResponse } from "./responses.ts";

export async function createSupabaseUser(supabaseServiceRole: any, email: string, password: string) {
  try {
    const { data: newUserData, error: createUserError } = await supabaseServiceRole.auth.admin.createUser({
      email: email.trim().toLowerCase(),
      password,
      email_confirm: true,
    });
    
    if (createUserError || !newUserData.user) {
      console.error("Supabase user creation error:", createUserError);
      
      // Tratamento específico para email duplicado
      if (createUserError?.message?.includes('User already registered') || 
          createUserError?.message?.includes('email_exists') ||
          createUserError?.code === 'email_exists') {
        return { error: buildErrorResponse("Este email já está cadastrado no sistema", 422) };
      }
      
      return { error: buildErrorResponse(createUserError?.message || "Erro ao criar usuário na autenticação", 500) };
    }
    
    return { user: newUserData.user };
  } catch (error: any) {
    console.error("Unexpected error in createSupabaseUser:", error);
    return { error: buildErrorResponse("Erro inesperado ao criar usuário", 500) };
  }
}
