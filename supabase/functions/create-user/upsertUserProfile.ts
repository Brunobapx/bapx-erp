
import { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";

export async function upsertUserProfile(
  supabaseServiceRole: SupabaseClient,
  userId: string,
  companyId: string,
  profileId: string,
  firstName?: string,
  lastName?: string
) {
  try {
    const { error } = await supabaseServiceRole
      .from('profiles')
      .upsert({
        id: userId,
        company_id: companyId,
        profile_id: profileId,
        first_name: firstName || '',
        last_name: lastName || '',
        is_active: true
      }, {
        onConflict: 'id'
      });

    return error;
  } catch (error) {
    console.error('Error upserting user profile:', error);
    return error;
  }
}
