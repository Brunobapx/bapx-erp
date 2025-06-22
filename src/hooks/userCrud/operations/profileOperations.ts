import { supabase } from "@/integrations/supabase/client";

export interface ProfileUpdateData {
  first_name?: string;
  last_name?: string;
  department?: string;
  position?: string;
  profile_id?: string;
  is_active?: boolean;
}

export const updateUserProfile = async (userId: string, data: ProfileUpdateData) => {
  const { error } = await supabase
    .from('profiles')
    .update({
      ...data,
      updated_at: new Date().toISOString()
    })
    .eq('id', userId);

  if (error) throw error;
};

// Keep the old function for backward compatibility
export const updateProfile = updateUserProfile;

export const updateUserStatus = async (userId: string, isActive: boolean) => {
  const { error } = await supabase
    .from('profiles')
    .update({ is_active: isActive })
    .eq('id', userId);
    
  if (error) throw error;
};
