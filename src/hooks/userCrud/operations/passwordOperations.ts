
import { supabase } from "@/integrations/supabase/client";

export const updateUserPassword = async (userId: string, newPassword: string, userRole: string) => {
  const { error } = await supabase.functions.invoke('update-user-password', {
    body: { 
      userId, 
      newPassword 
    },
    headers: {
      'x-requester-role': userRole,
    },
  });

  if (error) {
    console.warn('Não foi possível atualizar a senha:', error);
    throw error;
  }
};
