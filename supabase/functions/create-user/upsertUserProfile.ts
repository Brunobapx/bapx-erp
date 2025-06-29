
import { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";

export async function upsertUserProfile(
  supabaseServiceRole: SupabaseClient,
  userId: string,
  companyId: string,
  profileId: string | null,
  firstName: string,
  lastName: string,
  department?: string | null,
  position?: string | null
) {
  try {
    console.log("Creating profile for user:", userId, "with company:", companyId);
    
    const profileData = {
      id: userId,
      company_id: companyId,
      profile_id: profileId,
      first_name: firstName || '',
      last_name: lastName || '',
      department: department || null,
      position: position || null,
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    console.log("Profile data:", profileData);

    const { error } = await supabaseServiceRole
      .from('profiles')
      .upsert(profileData, {
        onConflict: 'id'
      });

    if (error) {
      console.error("Database error creating profile:", error);
    }

    return error;
  } catch (error) {
    console.error('Error upserting user profile:', error);
    return error;
  }
}
