
import { useState } from 'react';
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from '@/components/Auth/AuthProvider';
import { validateWithSecurity, userOperationSchemas } from '@/lib/enhancedValidation';
import { sanitizer } from '@/lib/advancedSanitization';
import { checkRateLimit, generalRateLimit } from '@/lib/rateLimiting';
import { auditUserAction, auditSecurityEvent } from '@/lib/auditLogging';

export interface UpdateUserData {
  first_name: string;
  last_name: string;
  department?: string;
  position?: string;
  role?: string;
  profile_id?: string;
  new_password?: string;
}

export const useUserUpdate = () => {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const { userRole, user } = useAuth();

  const updateUser = async (userId: string, userData: UpdateUserData) => {
    setLoading(true);
    
    try {
      // Rate limiting check
      const currentUserId = user?.id || 'anonymous';
      const rateLimitCheck = checkRateLimit(generalRateLimit, currentUserId);
      
      if (!rateLimitCheck.allowed) {
        auditSecurityEvent(
          'rate_limit_exceeded',
          { operation: 'update_user', userId: currentUserId },
          undefined,
          navigator.userAgent,
          false,
          'Rate limit exceeded for user update'
        );
        
        throw new Error('Muitas tentativas. Tente novamente mais tarde.');
      }

      // Validar e sanitizar dados
      const validation = validateWithSecurity(
        userOperationSchemas.updateUser,
        {
          first_name: sanitizer.sanitizeText(userData.first_name),
          last_name: sanitizer.sanitizeText(userData.last_name),
          department: userData.department ? sanitizer.sanitizeText(userData.department) : undefined,
          position: userData.position ? sanitizer.sanitizeText(userData.position) : undefined,
          role: userData.role,
          profile_id: userData.profile_id,
          new_password: userData.new_password,
        },
        'update_user'
      );

      if (!validation.success) {
        auditUserAction(
          'update_user_validation_failed',
          currentUserId,
          user?.email || 'unknown',
          { targetUserId: userId, errors: validation.errors },
          false,
          validation.errors.join(', ')
        );
        
        throw new Error(validation.errors[0]);
      }

      const validatedData = validation.data;

      // Atualizar dados do perfil
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          first_name: validatedData.first_name,
          last_name: validatedData.last_name,
          department: validatedData.department,
          position: validatedData.position,
          profile_id: validatedData.profile_id || null,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId);

      if (profileError) throw profileError;

      // Atualizar role se fornecida
      if (userData.role) {
        const { error: roleError } = await supabase
          .from('user_roles')
          .update({ role: userData.role })
          .eq('user_id', userId);

        if (roleError) throw roleError;
      }

      // Atualizar senha se fornecida
      if (userData.new_password?.trim()) {
        const { error: passwordError } = await supabase.functions.invoke('update-user-password', {
          body: { 
            userId, 
            newPassword: userData.new_password 
          },
          headers: {
            'x-requester-role': userRole,
          },
        });

        if (passwordError) {
          console.warn('Não foi possível atualizar a senha:', passwordError);
        }
      }

      // Log sucesso
      auditUserAction(
        'update_user_success',
        currentUserId,
        user?.email || 'unknown',
        { 
          targetUserId: userId,
          updatedFields: Object.keys(validatedData)
        }
      );

      toast({
        title: "Sucesso",
        description: "Usuário atualizado com sucesso!",
      });

      return { success: true };
    } catch (error: any) {
      console.error('Erro ao atualizar usuário:', error);
      
      auditUserAction(
        'update_user_failed',
        user?.id || 'anonymous',
        user?.email || 'unknown',
        { targetUserId: userId, error: error.message },
        false,
        error.message
      );
      
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

  const updateUserStatus = async (userId: string, isActive: boolean) => {
    try {
      const currentUserId = user?.id || 'anonymous';
      
      const { error } = await supabase
        .from('profiles')
        .update({ is_active: isActive })
        .eq('id', userId);
        
      if (error) throw error;
      
      // Log da ação
      auditUserAction(
        'update_user_status',
        currentUserId,
        user?.email || 'unknown',
        { targetUserId: userId, newStatus: isActive }
      );
      
      toast({
        title: "Sucesso",
        description: `Usuário ${isActive ? 'ativado' : 'desativado'} com sucesso!`,
      });
      
      return { success: true };
    } catch (error: any) {
      console.error('Error updating user status:', error);
      
      auditUserAction(
        'update_user_status_failed',
        user?.id || 'anonymous',
        user?.email || 'unknown',
        { targetUserId: userId, error: error.message },
        false,
        error.message
      );
      
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
