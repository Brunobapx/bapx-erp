
export async function insertUserRole(supabaseServiceRole: any, userId: string, role: string, companyId: string) {
  // Usar upsert para evitar conflitos
  const { error } = await supabaseServiceRole
    .from('user_roles')
    .upsert({ 
      user_id: userId, 
      role, 
      company_id: companyId 
    }, {
      onConflict: 'user_id,role',
      ignoreDuplicates: false
    });
  return error;
}
