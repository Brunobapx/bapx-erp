
import { useState } from 'react';
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from '@/components/Auth/AuthProvider';
import { checkRateLimit, generalRateLimit } from '@/lib/rateLimiting';
import { auditUserAction, auditSecurityEvent } from '@/lib/auditLogging';

export const useUserDelete = () => {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const { userRole, user } = useAuth();

  const deleteUser = async (userId: string) => {
    setLoading(true);
    
    try {
      const currentUserId = user?.id || 'anonymous';
      
      // Rate limiting check
      const rateLimitCheck = checkRateLimit(generalRateLimit, currentUserId);
      
      if (!rateLimitCheck.allowed) {
        auditSecurityEvent(
          'rate_limit_exceeded',
          { operation: 'delete_user', userId: currentUserId },
          undefined,
          navigator.userAgent,
          false,
          'Rate limit exceeded for user deletion'
        );
        
        throw new Error('Muitas tentativas. Tente novamente mais tarde.');
      }

      const { error } = await supabase.functions.invoke('delete-user', {
        body: { userId },
        headers: {
          'x-requester-role': userRole,
        },
      });

      if (error) throw error;

      // Log sucesso
      auditUserAction(
        'delete_user_success',
        currentUserId,
        user?.email || 'unknown',
        { targetUserId: userId }
      );

      toast({
        title: "Sucesso",
        description: "Usuário excluído com sucesso!",
      });

      return { success: true };
    } catch (error: any) {
      console.error('Erro ao excluir usuário:', error);
      
      auditUserAction(
        'delete_user_failed',
        user?.id || 'anonymous',
        user?.email || 'unknown',
        { targetUserId: userId, error: error.message },
        false,
        error.message
      );
      
      toast({
        title: "Erro",
        description: error.message || "Erro ao excluir usuário",
        variant: "destructive",
      });
      
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  };

  return {
    deleteUser,
    loading,
  };
};
