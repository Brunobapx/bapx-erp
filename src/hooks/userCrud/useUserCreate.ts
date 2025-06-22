
import { useState } from 'react';
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { validateCreateUserData } from './validation/createUserValidation';
import { checkRateLimit } from './security/rateLimitUtils';
import { logUserAction } from './audit/auditUtils';
import type { CreateUserData, OperationResult } from './types';

export const useUserCreate = () => {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const createUser = async (userData: CreateUserData): Promise<OperationResult> => {
    try {
      setLoading(true);

      // Rate limiting check
      const rateLimitPassed = await checkRateLimit('create_user');
      if (!rateLimitPassed) {
        toast({
          title: "Erro",
          description: "Muitas tentativas. Tente novamente em alguns minutos.",
          variant: "destructive",
        });
        return { success: false, error: "Rate limit exceeded" };
      }

      // Validate input data
      const validationResult = validateCreateUserData(userData);
      if (!validationResult.success) {
        // Type guard: we know success is false, so errors exists
        const errorMessage = validationResult.errors.length > 0 
          ? validationResult.errors[0] 
          : "Dados inválidos";
        
        toast({
          title: "Erro de validação",
          description: errorMessage,
          variant: "destructive",
        });
        
        return { 
          success: false, 
          error: validationResult.errors.join(', ') 
        };
      }

      console.log('Creating user with validated data:', validationResult.data);

      // Call Supabase Edge Function to create user
      const { data, error } = await supabase.functions.invoke('create-user', {
        body: {
          email: userData.email,
          password: userData.password,
          firstName: userData.firstName,
          lastName: userData.lastName,
          role: userData.role,
          profileId: userData.profileId,
          department: userData.department,
          position: userData.position,
        },
      });

      if (error) {
        console.error('Error creating user:', error);
        const errorMessage = error.message || "Erro ao criar usuário";
        
        toast({
          title: "Erro",
          description: errorMessage,
          variant: "destructive",
        });

        return { success: false, error: errorMessage };
      }

      // Log successful user creation
      await logUserAction('create_user', {
        targetUserId: data?.user?.id,
        userData: {
          email: userData.email,
          role: userData.role,
        }
      });

      toast({
        title: "Sucesso",
        description: "Usuário criado com sucesso!",
      });

      return { success: true, data };
      
    } catch (error: any) {
      console.error('Unexpected error creating user:', error);
      const errorMessage = error.message || "Erro inesperado ao criar usuário";
      
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
    createUser,
    loading,
  };
};
