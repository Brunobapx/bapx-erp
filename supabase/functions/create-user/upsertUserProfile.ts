
import { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";

export async function upsertUserProfile(
  supabase: SupabaseClient,
  userId: string,
  companyId: string,
  profileId?: string
): Promise<Error | null> {
  try {
    const profileData: any = {
      id: userId,
      company_id: companyId,
      first_name: '',
      last_name: '',
      is_active: true,
    };

    // Adicionar profile_id se fornecido
    if (profileId) {
      profileData.profile_id = profileId;
    }

    const { error } = await supabase
      .from('profiles')
      .upsert(profileData);

    return error;
  } catch (error) {
    return error as Error;
  }
}
