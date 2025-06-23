
import { supabase } from "@/integrations/supabase/client";
import { EditUserFormData, EditUserValidationErrors } from './types';
import { SimpleUser } from '@/hooks/useSimpleUserManagement';

export const submitUserUpdate = async (
  user: SimpleUser,
  formData: EditUserFormData,
  userRole: string
): Promise<{ success: boolean; errors?: EditUserValidationErrors }> => {
  try {
    console.log('Updating user with data:', formData);

    // Atualizar dados do perfil
    const { error: profileError } = await supabase
      .from('profiles')
      .update({
        first_name: formData.first_name,
        last_name: formData.last_name,
        department: formData.department,
        position: formData.position,
        profile_id: formData.profile_id || null,
        updated_at: new Date().toISOString()
      })
      .eq('id', user.id);

    if (profileError) {
      console.error('Profile update error:', profileError);
      throw profileError;
    }

    // Atualizar role se mudou
    if (formData.role !== user.role) {
      const { error: roleError } = await supabase
        .from('user_roles')
        .upsert({ 
          user_id: user.id, 
          role: formData.role,
          company_id: user.company_id || null
        })
        .eq('user_id', user.id);

      if (roleError) {
        console.error('Role update error:', roleError);
        throw roleError;
      }
    }

    // Atualizar senha se fornecida
    if (formData.new_password.trim()) {
      try {
        const { error: functionError } = await supabase.functions.invoke('update-user-password', {
          body: { 
            userId: user.id, 
            newPassword: formData.new_password 
          },
          headers: {
            'x-requester-role': userRole,
          },
        });

        if (functionError) {
          console.warn('Não foi possível atualizar a senha:', functionError);
          // Continue with success but log the warning
        }
      } catch (passwordError) {
        console.warn('Password update failed:', passwordError);
        // Don't fail the entire update for password issues
      }
    }

    console.log('User update completed successfully');
    return { success: true };
  } catch (error: any) {
    console.error('Erro ao atualizar usuário:', error);
    return { 
      success: false, 
      errors: { general: error.message || "Erro ao atualizar usuário" }
    };
  }
};
