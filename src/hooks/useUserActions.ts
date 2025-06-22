
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from '@/components/Auth/AuthProvider';

export const useUserActions = () => {
  const { toast } = useToast();
  const { companyInfo } = useAuth();

  const updateUserStatus = async (userId: string, isActive: boolean) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ is_active: isActive })
        .eq('id', userId);
        
      if (error) throw error;
      
      toast({
        title: "Sucesso",
        description: `Usuário ${isActive ? 'ativado' : 'desativado'} com sucesso!`,
      });
      
      return true;
    } catch (error) {
      console.error('Error updating user status:', error);
      toast({ 
        title: "Erro", 
        description: "Erro ao atualizar status do usuário", 
        variant: "destructive" 
      });
      return false;
    }
  };

  const updateUserRole = async (userId: string, role: string) => {
    try {
      const { error } = await supabase
        .from('user_roles')
        .upsert({ user_id: userId, role, company_id: companyInfo?.id });

      if (error) throw error;

      toast({ 
        title: "Sucesso", 
        description: "Papel do usuário atualizado com sucesso!" 
      });
      
      return true;
    } catch (error) {
      console.error('Error updating user role:', error);
      toast({ 
        title: "Erro", 
        description: "Erro ao atualizar papel do usuário", 
        variant: "destructive" 
      });
      return false;
    }
  };

  const updateUserProfile = async (userId: string, profileId: string) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ 
          profile_id: profileId || null,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId);

      if (error) throw error;

      toast({ 
        title: "Sucesso", 
        description: "Perfil de acesso do usuário atualizado com sucesso!" 
      });
      
      return true;
    } catch (error) {
      console.error('Error updating user profile:', error);
      toast({ 
        title: "Erro", 
        description: "Erro ao atualizar perfil de acesso do usuário", 
        variant: "destructive" 
      });
      return false;
    }
  };

  return {
    updateUserStatus,
    updateUserRole,
    updateUserProfile,
  };
};
