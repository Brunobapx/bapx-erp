
import { buildErrorResponse } from "./responses.ts";

export async function createSupabaseUser(supabaseServiceRole: any, email: string, password: string) {
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
