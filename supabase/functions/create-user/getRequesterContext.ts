
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { buildErrorResponse } from "./responses.ts";

export async function getRequesterContext(req: Request, supabaseUrl: string, anonKey: string, supabaseServiceRole: any) {
  const authHeader = req.headers.get("authorization");
  if (!authHeader) return { error: buildErrorResponse("Token de autorização não fornecido", 401) };
  const supabaseUser = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: authHeader } }
  });
  const { data: userData, error: userError } = await supabaseUser.auth.getUser();
  if (userError || !userData.user) return { error: buildErrorResponse("Usuário não autenticado", 401) };
  const requesterId = userData.user.id;
  const { data: requesterProfile, error: profileError } = await supabaseServiceRole
    .from('profiles').select('company_id').eq('id', requesterId).single();
  if (profileError || !requesterProfile?.company_id) {
    return { error: buildErrorResponse("Não foi possível obter dados da empresa do usuário solicitante") };
  }
  const companyId = requesterProfile.company_id;
  if (!companyId) {
    return { error: buildErrorResponse("Impossível associar usuário sem empresa definida. Entre em contato com o suporte.") };
  }
  return { requesterId, companyId };
}
