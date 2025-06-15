
export async function upsertUserProfile(supabaseServiceRole: any, userId: string, companyId: string) {
  // Usar upsert para garantir que não haverá conflito se o trigger criar primeiro
  const { error } = await supabaseServiceRole
    .from('profiles')
    .upsert({ 
      id: userId, 
      company_id: companyId, 
      is_active: true, 
      first_name: '', 
      last_name: '' 
    }, {
      onConflict: 'id',
      ignoreDuplicates: false
    });
  return error;
}
