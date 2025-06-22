
import { supabase } from "@/integrations/supabase/client";

export interface ProfileUpdateData {
  first_name: string;
  last_name: string;
  department?: string;
  position?: string;
  profile_id?: string;
}

export const updateProfile = async (userId: string, data: ProfileUpdateData) => {
  const { error } = await supabase
    .from('profiles')
    .update({
      first_name: data.first_name,
      last_name: data.last_name,
      department: data.department,
      position: data.position,
      profile_id: data.profile_id || null,
      updated_at: new Date().toISOString()
    })
    .eq('id', userId);

  if (error) throw error;
};

export const updateUserStatus = async (userId: string, isActive: boolean) => {
  const { error } = await supabase
    .from('profiles')
    .update({ is_active: isActive })
    .eq('id', userId);
    
  if (error) throw error;
};
