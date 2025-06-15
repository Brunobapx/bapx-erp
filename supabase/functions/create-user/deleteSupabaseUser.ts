
export async function deleteSupabaseUser(supabaseServiceRole: any, userId: string) {
  await supabaseServiceRole.auth.admin.deleteUser(userId);
}
