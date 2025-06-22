
import { supabase } from "@/integrations/supabase/client";

export const updateUserRole = async (userId: string, role: string) => {
  const { error } = await supabase
    .from('user_roles')
    .update({ role })
    .eq('user_id', userId);

  if (error) throw error;
};
