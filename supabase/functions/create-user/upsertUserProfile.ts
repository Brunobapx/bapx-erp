
export async function upsertUserProfile(supabaseServiceRole: any, userId: string, companyId: string) {
  const { error } = await supabaseServiceRole
    .from('profiles')
    .upsert({ id: userId, company_id: companyId, is_active: true, first_name: '', last_name: '' });
  return error;
}
