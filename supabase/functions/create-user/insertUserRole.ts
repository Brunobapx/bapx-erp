
export async function insertUserRole(supabaseServiceRole: any, userId: string, role: string, companyId: string) {
  const { error } = await supabaseServiceRole
    .from('user_roles').insert({ user_id: userId, role, company_id: companyId });
  return error;
}
