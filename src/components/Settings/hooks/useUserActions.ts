
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from '@/components/Auth/AuthProvider';

export const useUserActions = (loadUsers: () => Promise<void>) => {
  const { toast } = useToast();
  const { userRole } = useAuth();

  // Update user status
  const handleUpdateUserStatus = async (userId: string, isActive: boolean) => {
    if (!confirm(`Tem certeza que deseja ${isActive ? 'ativar' : 'desativar'} este usuário?`)) return;
    
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
      
      // Recarregar usuários após mudança
      await loadUsers();
    } catch (error) {
      console.error('Error updating user status:', error);
      toast({ 
        title: "Erro", 
        description: "Erro ao atualizar status do usuário", 
        variant: "destructive" 
      });
    }
  };

  // Update user profile
  const handleUpdateUserProfile = async (userId: string, profileId: string) => {
    if (!confirm('Tem certeza que deseja alterar o perfil deste usuário?')) return;
    
    try {
      // Atualizar perfil do usuário
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
        description: "Perfil do usuário atualizado com sucesso! As novas permissões serão aplicadas no próximo login." 
      });
      
      // Recarregar usuários após mudança
      await loadUsers();
    } catch (error) {
      console.error('Error updating user profile:', error);
      toast({ 
        title: "Erro", 
        description: "Erro ao atualizar perfil do usuário", 
        variant: "destructive" 
      });
    }
  };

  // Delete user
  const handleDeleteUser = async (userId: string) => {
    try {
      // Primeiro, deletar das tabelas relacionadas
      await supabase.from('user_roles').delete().eq('user_id', userId);
      await supabase.from('profiles').delete().eq('id', userId);
      
      // Deletar usuário do auth usando edge function
      const { error } = await supabase.functions.invoke('delete-user', {
        body: { userId },
        headers: {
          'x-requester-role': userRole,
        },
      });

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Usuário excluído com sucesso!",
      });
      
      // Recarregar usuários após exclusão
      await loadUsers();
    } catch (error: any) {
      console.error('Error deleting user:', error);
      toast({ 
        title: "Erro", 
        description: error.message || "Erro ao excluir usuário", 
        variant: "destructive" 
      });
    }
  };

  return {
    handleUpdateUserStatus,
    handleUpdateUserProfile,
    handleDeleteUser
  };
};
