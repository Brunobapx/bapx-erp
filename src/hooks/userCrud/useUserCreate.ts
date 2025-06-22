
import { useState } from 'react';
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from '@/components/Auth/AuthProvider';
import { validateWithSecurity, userOperationSchemas } from '@/lib/enhancedValidation';
import { sanitizer } from '@/lib/sanitization';
import { checkRateLimit, generalRateLimit } from '@/lib/rateLimiting';
import { auditUserAction, auditSecurityEvent } from '@/lib/auditLogging';

export interface CreateUserData {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  profileId: string;
  role: string;
  department?: string;
  position?: string;
}

export const useUserCreate = () => {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const { userRole, user } = useAuth();

  const createUser = async (userData: CreateUserData) => {
    setLoading(true);
    
    try {
      const currentUserId = user?.id || 'anonymous';
      
      // Rate limiting check
      const rateLimitCheck = checkRateLimit(generalRateLimit, currentUserId);
      
      if (!rateLimitCheck.allowed) {
        auditSecurityEvent(
          'rate_limit_exceeded',
          { operation: 'create_user', userId: currentUserId },
          undefined,
          navigator.userAgent,
          false,
          'Rate limit exceeded for user creation'
        );
        
        throw new Error('Muitas tentativas. Tente novamente mais tarde.');
      }

      // Validar e sanitizar dados
      const validation = validateWithSecurity(
        userOperationSchemas.createUser,
        {
          firstName: sanitizer.sanitizeText(userData.firstName),
          lastName: sanitizer.sanitizeText(userData.lastName),
          email: sanitizer.sanitizeText(userData.email),
          password: userData.password,
          profileId: userData.profileId,
          role: userData.role,
          department: userData.department ? sanitizer.sanitizeText(userData.department) : undefined,
          position: userData.position ? sanitizer.sanitizeText(userData.position) : undefined,
        },
        'create_user'
      );

      if (!validation.success) {
        auditUserAction(
          'create_user_validation_failed',
          currentUserId,
          user?.email || 'unknown',
          { userData: { email: userData.email }, validationErrors: validation.errors },
          false,
          validation.errors.join(', ')
        );
        
        throw new Error(validation.errors[0]);
      }

      const validatedData = validation.data;

      const { error } = await supabase.functions.invoke('create-user', {
        body: {
          email: validatedData.email,
          password: validatedData.password,
          firstName: validatedData.firstName,
          lastName: validatedData.lastName,
          role: validatedData.role,
          profileId: validatedData.profileId || null,
          department: validatedData.department,
          position: validatedData.position,
        },
        headers: {
          'x-requester-role': userRole,
        },
      });

      if (error) throw error;

      // Log sucesso
      auditUserAction(
        'create_user_success',
        currentUserId,
        user?.email || 'unknown',
        { 
          createdUserEmail: validatedData.email,
          role: validatedData.role
        }
      );

      toast({
        title: "Sucesso",
        description: "Usuário criado com sucesso!",
      });

      return { success: true };
    } catch (error: any) {
      console.error('Erro ao criar usuário:', error);
      
      auditUserAction(
        'create_user_failed',
        user?.id || 'anonymous',
        user?.email || 'unknown',
        { userData: { email: userData.email }, error: error.message },
        false,
        error.message
      );
      
      toast({
        title: "Erro",
        description: error.message || "Erro ao criar usuário",
        variant: "destructive",
      });
      
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  };

  return {
    createUser,
    loading,
  };
};
