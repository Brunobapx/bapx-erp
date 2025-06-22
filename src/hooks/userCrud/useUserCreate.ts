
import { useState } from 'react';
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from '@/components/Auth/AuthProvider';
import { validateWithSecurity, userOperationSchemas } from '@/lib/enhancedValidation';
import { sanitizer } from '@/lib/advancedSanitization';
import { checkRateLimit, createUserRateLimit } from '@/lib/rateLimiting';
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
  const { companyInfo, userRole, user } = useAuth();

  const createUser = async (userData: CreateUserData) => {
    setLoading(true);
    
    try {
      // Rate limiting check
      const userId = user?.id || 'anonymous';
      const rateLimitCheck = checkRateLimit(createUserRateLimit, userId);
      
      if (!rateLimitCheck.allowed) {
        auditSecurityEvent(
          'rate_limit_exceeded',
          { operation: 'create_user', userId },
          undefined,
          navigator.userAgent,
          false,
          'Rate limit exceeded for user creation'
        );
        
        throw new Error('Muitas tentativas de criação. Tente novamente mais tarde.');
      }

      // Validar e sanitizar dados
      const validation = validateWithSecurity(
        userOperationSchemas.createUser,
        {
          firstName: sanitizer.sanitizeText(userData.firstName),
          lastName: sanitizer.sanitizeText(userData.lastName),
          email: sanitizer.sanitizeEmail(userData.email),
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
          userId,
          user?.email || 'unknown',
          { errors: validation.errors },
          false,
          validation.errors.join(', ')
        );
        
        throw new Error(validation.errors[0]);
      }

      const validatedData = validation.data;

      // Detectar tentativas de ataque
      if (sanitizer.detectXSS(userData.firstName) || sanitizer.detectXSS(userData.lastName)) {
        auditSecurityEvent(
          'xss_attempt',
          { operation: 'create_user', data: userData },
          undefined,
          navigator.userAgent,
          false,
          'XSS attempt detected in user creation'
        );
        
        throw new Error('Dados inválidos detectados.');
      }

      const { error } = await supabase.functions.invoke('create-user', {
        body: {
          email: validatedData.email,
          password: validatedData.password,
          firstName: validatedData.firstName,
          lastName: validatedData.lastName,
          role: validatedData.role,
          profileId: validatedData.profileId || null,
          department: validatedData.department || null,
          position: validatedData.position || null,
          companyId: companyInfo?.id,
        },
        headers: {
          'x-requester-role': userRole,
        },
      });

      if (error) throw error;

      // Log sucesso
      auditUserAction(
        'create_user_success',
        userId,
        user?.email || 'unknown',
        { 
          targetEmail: validatedData.email,
          role: validatedData.role,
          profileId: validatedData.profileId 
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
        { error: error.message },
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
