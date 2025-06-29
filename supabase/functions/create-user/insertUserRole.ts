
export async function insertUserRole(supabaseServiceRole: any, userId: string, role: string, companyId: string) {
  try {
    console.log("Creating/updating user role:", { userId, role, companyId });
    
    const { error } = await supabaseServiceRole
      .from('user_roles')
      .upsert({
        user_id: userId,
        role: role,
        company_id: companyId,
        created_at: new Date().toISOString()
      }, {
        onConflict: 'user_id,role'
      });

    if (error) {
      console.error("Database error creating/updating user role:", error);
    }

    return error;
  } catch (error) {
    console.error('Error inserting/updating user role:', error);
    return error;
  }
}
