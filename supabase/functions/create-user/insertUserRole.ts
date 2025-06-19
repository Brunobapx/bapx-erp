
export async function insertUserRole(supabaseServiceRole: any, userId: string, role: string, companyId: string) {
  try {
    // Inserir role no sistema antigo para compatibilidade
    const { error: roleError } = await supabaseServiceRole
      .from('user_roles')
      .upsert({ 
        user_id: userId, 
        role, 
        company_id: companyId 
      }, {
        onConflict: 'user_id,company_id',
        ignoreDuplicates: false
      });

    if (roleError && !roleError.message.includes('duplicate')) {
      console.error('Error inserting user role:', roleError);
      return roleError;
    }

    // Buscar perfil adequado baseado no role
    let targetPerfilId = null;
    
    if (role === 'master') {
      const { data: masterPerfil } = await supabaseServiceRole
        .from('perfis')
        .select('id')
        .eq('empresa_id', companyId)
        .eq('nome', 'Master')
        .single();
      targetPerfilId = masterPerfil?.id;
    } else if (role === 'admin') {
      const { data: adminPerfil } = await supabaseServiceRole
        .from('perfis')
        .select('id')
        .eq('empresa_id', companyId)
        .eq('is_admin', true)
        .eq('nome', 'Administrador')
        .single();
      targetPerfilId = adminPerfil?.id;
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
    }

    // Atualizar perfil do usuário se encontrado
    if (targetPerfilId) {
      const { error: profileUpdateError } = await supabaseServiceRole
        .from('profiles')
        .update({ perfil_id: targetPerfilId })
        .eq('id', userId);

      if (profileUpdateError) {
        console.error('Error updating user profile:', profileUpdateError);
        return profileUpdateError;
      }
    }

    return null;
  } catch (error) {
    console.error('Error in insertUserRole:', error);
    return error;
  }
}
