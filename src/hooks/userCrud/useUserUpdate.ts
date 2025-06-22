
import { useState } from 'react';
import { useToast } from "@/hooks/use-toast";
import { validateUpdateUserData } from './validation/updateUserValidation';
import { updateUserProfile } from './operations/profileOperations';
import { updateUserRole } from './operations/roleOperations';
import { updateUserPassword } from './operations/passwordOperations';
import { checkRateLimit } from './security/rateLimitUtils';
import { logUserAction } from './audit/auditUtils';
import type { UpdateUserData, OperationResult } from './types';

export const useUserUpdate = () => {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const updateUser = async (userId: string, userData: UpdateUserData): Promise<OperationResult> => {
    try {
      setLoading(true);

      // Rate limiting check
      const rateLimitPassed = await checkRateLimit('update_user');
      if (!rateLimitPassed) {
        toast({
          title: "Erro",
          description: "Muitas tentativas. Tente novamente em alguns minutos.",
          variant: "destructive",
        });
        return { success: false, error: "Rate limit exceeded" };
      }

      // Validate input data
      const validationResult = validateUpdateUserData(userData);
      if (!validationResult.success) {
        const errorMessage = 'errors' in validationResult && validationResult.errors 
          ? validationResult.errors[0] 
          : "Dados inválidos";
        toast({
          title: "Erro de validação",
          description: errorMessage,
          variant: "destructive",
        });
        return { 
          success: false, 
          error: 'errors' in validationResult && validationResult.errors 
            ? validationResult.errors.join(', ') 
            : "Validation failed" 
        };
      }

      console.log('Updating user with validated data:', validationResult.data);

      // Update profile data
      if (userData.first_name || userData.last_name || userData.department || userData.position || userData.profile_id !== undefined) {
        await updateUserProfile(userId, {
          first_name: userData.first_name,
          last_name: userData.last_name,
          department: userData.department,
          position: userData.position,
          profile_id: userData.profile_id,
        });
      }

      // Update role if provided
      if (userData.role) {
        await updateUserRole(userId, userData.role);
      }

      // Update password if provided
      if (userData.new_password) {
        await updateUserPassword(userId, userData.new_password);
      }

      // Log successful user update
      await logUserAction('update_user', {
        targetUserId: userId,
        userData: validationResult.data
      });

      toast({
        title: "Sucesso",
        description: "Usuário atualizado com sucesso!",
      });

      return { success: true, data: validationResult.data };
      
    } catch (error: any) {
      console.error('Error updating user:', error);
      const errorMessage = error.message || "Erro ao atualizar usuário";
      
      toast({
        title: "Erro",
        description: errorMessage,
        variant: "destructive",
      });

      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  const updateUserStatus = async (userId: string, isActive: boolean): Promise<OperationResult> => {
    try {
      setLoading(true);

      await updateUserProfile(userId, { is_active: isActive });

      toast({
        title: "Sucesso",
        description: `Usuário ${isActive ? 'ativado' : 'desativado'} com sucesso!`,
      });

      return { success: true };
      
    } catch (error: any) {
      console.error('Error updating user status:', error);
      const errorMessage = error.message || "Erro ao atualizar status do usuário";
      
      toast({
        title: "Erro",
        description: errorMessage,
        variant: "destructive",
      });

      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  return {
    updateUser,
    updateUserStatus,
    loading,
  };
};
