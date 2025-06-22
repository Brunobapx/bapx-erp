
import { useState } from 'react';
import { useToast } from "@/hooks/use-toast";
import { useAuth } from '@/components/Auth/AuthProvider';
import { UpdateUserData, OperationResult } from './types';
import { validateUpdateUserData } from './validation/updateUserValidation';
import { updateProfile, updateUserStatus as updateProfileStatus } from './operations/profileOperations';
import { updateUserRole } from './operations/roleOperations';
import { updateUserPassword } from './operations/passwordOperations';
import { checkUserOperationRateLimit } from './security/rateLimitUtils';
import { 
  logValidationFailed, 
  logUpdateSuccess, 
  logUpdateFailed,
  logStatusUpdateSuccess,
  logStatusUpdateFailed
} from './audit/auditUtils';

export const useUserUpdate = () => {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const { userRole, user } = useAuth();

  const updateUser = async (userId: string, userData: UpdateUserData): Promise<OperationResult> => {
    setLoading(true);
    
    try {
      const currentUserId = user?.id || 'anonymous';
      const userEmail = user?.email || 'unknown';
      
      // Rate limiting check
      checkUserOperationRateLimit(currentUserId, 'update_user');

      // Validar e sanitizar dados
      const validation = validateUpdateUserData(userData);

      if (!validation.success) {
        logValidationFailed(currentUserId, userEmail, userId, validation.errors);
        throw new Error(validation.errors[0]);
      }

      const validatedData = validation.data;

      // Atualizar dados do perfil
      await updateProfile(userId, {
        first_name: validatedData.first_name!,
        last_name: validatedData.last_name!,
        department: validatedData.department,
        position: validatedData.position,
        profile_id: validatedData.profile_id,
      });

      // Atualizar role se fornecida
      if (userData.role) {
        await updateUserRole(userId, userData.role);
      }

      // Atualizar senha se fornecida
      if (userData.new_password?.trim()) {
        try {
          await updateUserPassword(userId, userData.new_password, userRole);
        } catch (passwordError) {
          console.warn('Não foi possível atualizar a senha:', passwordError);
        }
      }

      // Log sucesso
      logUpdateSuccess(currentUserId, userEmail, userId, Object.keys(validatedData));

      toast({
        title: "Sucesso",
        description: "Usuário atualizado com sucesso!",
      });

      return { success: true };
    } catch (error: any) {
      console.error('Erro ao atualizar usuário:', error);
      
      logUpdateFailed(user?.id || 'anonymous', user?.email || 'unknown', userId, error.message);
      
      toast({
        title: "Erro",
        description: error.message || "Erro ao atualizar usuário",
        variant: "destructive",
      });
      
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  };

  const updateUserStatus = async (userId: string, isActive: boolean): Promise<OperationResult> => {
    try {
      const currentUserId = user?.id || 'anonymous';
      const userEmail = user?.email || 'unknown';
      
      await updateProfileStatus(userId, isActive);
      
      logStatusUpdateSuccess(currentUserId, userEmail, userId, isActive);
      
      toast({
        title: "Sucesso",
        description: `Usuário ${isActive ? 'ativado' : 'desativado'} com sucesso!`,
      });
      
      return { success: true };
    } catch (error: any) {
      console.error('Error updating user status:', error);
      
      logStatusUpdateFailed(user?.id || 'anonymous', user?.email || 'unknown', userId, error.message);
      
      toast({ 
        title: "Erro", 
        description: "Erro ao atualizar status do usuário", 
        variant: "destructive" 
      });
      
      return { success: false, error: error.message };
    }
  };

  return {
    updateUser,
    updateUserStatus,
    loading,
  };
};
