
export async function getRequesterContext(req: Request, supabaseUrl: string, anonKey: string, supabaseServiceRole: any) {
  try {
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      return { error: new Response(JSON.stringify({ error: "Token de autorização não encontrado" }), { status: 401 }) };
    }

    // Extrair o token JWT
    const token = authHeader.replace('Bearer ', '');
    
    // Verificar e decodificar o token para obter o user_id
    const { data: { user }, error: userError } = await supabaseServiceRole.auth.getUser(token);
    
    if (userError || !user) {
      console.error("Error getting user from token:", userError);
      return { error: new Response(JSON.stringify({ error: "Token inválido" }), { status: 401 }) };
    }

    console.log("Requester user ID:", user.id);

    // Buscar company_id do solicitante
    const { data: profile, error: profileError } = await supabaseServiceRole
      .from('profiles')
      .select('company_id')
      .eq('id', user.id)
      .single();

    if (profileError || !profile) {
      console.error("Error getting requester profile:", profileError);
      return { error: new Response(JSON.stringify({ error: "Perfil do solicitante não encontrado" }), { status: 404 }) };
    }

    console.log("Requester company ID:", profile.company_id);

    return {
      userId: user.id,
      companyId: profile.company_id
    };
  } catch (error) {
    console.error('Error in getRequesterContext:', error);
    return { error: new Response(JSON.stringify({ error: "Erro ao obter contexto do solicitante" }), { status: 500 }) };
  }
}
