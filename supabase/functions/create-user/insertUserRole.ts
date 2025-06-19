
export async function insertUserRole(supabaseServiceRole: any, userId: string, role: string, companyId: string) {
  try {
    console.log(`[insertUserRole] Starting for user ${userId}, role ${role}, company ${companyId}`);
    
    // Verificar se já existe um user_role para evitar conflito
    const { data: existingRole, error: checkError } = await supabaseServiceRole
      .from('user_roles')
      .select('id, role')
      .eq('user_id', userId)
      .eq('company_id', companyId)
      .single();

    if (checkError && checkError.code !== 'PGRST116') {
      console.error('Error checking existing user role:', checkError);
      return checkError;
    }

    // Se já existe, atualizar em vez de inserir
    if (existingRole) {
      console.log(`[insertUserRole] Updating existing role from ${existingRole.role} to ${role}`);
      const { error: updateError } = await supabaseServiceRole
        .from('user_roles')
        .update({ role })
        .eq('user_id', userId)
        .eq('company_id', companyId);

      if (updateError) {
        console.error('Error updating user role:', updateError);
        return updateError;
      }
    } else {
      // Inserir nova role se não existe
      console.log(`[insertUserRole] Creating new role ${role}`);
      const { error: roleError } = await supabaseServiceRole
        .from('user_roles')
        .insert({ 
          user_id: userId, 
          role, 
          company_id: companyId 
        });

      if (roleError) {
        console.error('Error inserting user role:', roleError);
        return roleError;
      }
    }

    // Buscar perfil adequado baseado no role
    let targetPerfilId = null;
    
    if (role === 'master') {
      console.log(`[insertUserRole] Looking for Master profile for company ${companyId}`);
      const { data: masterPerfil, error: masterError } = await supabaseServiceRole
        .from('perfis')
        .select('id')
        .eq('empresa_id', companyId)
        .eq('nome', 'Master')
        .single();
      
      if (masterError) {
        console.error('Error finding Master profile:', masterError);
      } else {
        targetPerfilId = masterPerfil?.id;
        console.log(`[insertUserRole] Found Master profile: ${targetPerfilId}`);
      }
    } else if (role === 'admin') {
      const { data: adminPerfil } = await supabaseServiceRole
        .from('perfis')
        .select('id')
        .eq('empresa_id', companyId)
        .eq('is_admin', true)
        .eq('nome', 'Administrador')
        .single();
      targetPerfilId = adminPerfil?.id;
      console.log(`[insertUserRole] Found Admin profile: ${targetPerfilId}`);
    } else {
      // Para outros roles, buscar ou criar perfil de usuário padrão
      const { data: userPerfil } = await supabaseServiceRole
        .from('perfis')
        .select('id')
        .eq('empresa_id', companyId)
        .eq('is_admin', false)
        .eq('nome', 'Usuário')
        .single();
      targetPerfilId = userPerfil?.id;
      console.log(`[insertUserRole] Found User profile: ${targetPerfilId}`);
    }

    // Atualizar perfil do usuário se encontrado
    if (targetPerfilId) {
      console.log(`[insertUserRole] Updating user profile to perfil_id: ${targetPerfilId}`);
      const { error: profileUpdateError } = await supabaseServiceRole
        .from('profiles')
        .update({ perfil_id: targetPerfilId })
        .eq('id', userId);

      if (profileUpdateError) {
        console.error('Error updating user profile:', profileUpdateError);
        return profileUpdateError;
      }
      console.log(`[insertUserRole] Successfully updated user profile`);
    } else {
      console.warn(`[insertUserRole] No profile found for role ${role} in company ${companyId}`);
    }

    console.log(`[insertUserRole] Successfully completed for user ${userId}`);
    return null;
  } catch (error) {
    console.error('Error in insertUserRole:', error);
    return error;
  }
}
