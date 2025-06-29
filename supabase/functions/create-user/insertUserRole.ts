
export async function insertUserRole(supabaseServiceRole: any, userId: string, role: string, companyId: string) {
  try {
    console.log("Creating user role:", { userId, role, companyId });
    
    const { error } = await supabaseServiceRole
      .from('user_roles')
      .insert({
        user_id: userId,
        role: role,
        company_id: companyId,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });

    if (error) {
      console.error("Database error creating user role:", error);
    }

    return error;
  } catch (error) {
    console.error('Error inserting user role:', error);
    return error;
  }
}
