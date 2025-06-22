
import { supabase } from "@/integrations/supabase/client";

export const updateUserPassword = async (userId: string, newPassword: string) => {
  const { error } = await supabase.functions.invoke('update-user-password', {
    body: { 
      userId, 
      newPassword 
    },
  });

  if (error) {
    console.warn('Não foi possível atualizar a senha:', error);
    throw error;
  }
};
