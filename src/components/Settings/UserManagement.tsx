
import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from '@/components/Auth/AuthProvider';
import { useProfiles } from '@/hooks/useProfiles';
import ActiveUsersTable from './ActiveUsersTable';
import CreateUserModal from './CreateUserModal';
import { DeleteUserModal } from './DeleteUserModal';

// Interface definitions
interface UserProfile {
  id: string;
  first_name: string;
  last_name: string;
  phone: string;
  department: string;
  position: string;
  is_active: boolean;
  last_login: string;
  role: string;
  email?: string;
  profile_id?: string;
  access_profile?: {
    name: string;
    description: string;
  };
}

export const UserManagement = () => {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [isCreateUserModalOpen, setIsCreateUserModalOpen] = useState(false);
  const [deleteUserModal, setDeleteUserModal] = useState<{
    open: boolean;
    userId: string;
    userName: string;
    userEmail: string;
  }>({
    open: false,
    userId: '',
    userName: '',
    userEmail: ''
  });
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const { userRole, companyInfo, user } = useAuth();
  const { profiles: accessProfiles } = useProfiles();

  // Security check - only admins and masters can access
  if (userRole !== 'admin' && userRole !== 'master') {
    return (
      <div className="text-center p-4">
        <p className="text-red-500">Acesso negado. Apenas administradores podem gerenciar usuários.</p>
      </div>
    );
  }

  // Fetch users
  const loadUsers = async () => {
    try {
      setLoading(true);
      console.log('Loading users for company:', companyInfo?.id);
      
      // Buscar usuários da empresa atual (incluindo usuários sem perfil)
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select(`
          id,
          first_name,
          last_name,
          phone,
          department,
          position,
          is_active,
          last_login,
          profile_id,
          access_profiles(
            name,
            description
          )
        `)
        .eq('company_id', companyInfo?.id);

      if (profilesError) throw profilesError;

      // Buscar emails e roles dos usuários
      const usersWithRoles = await Promise.all(
        (profilesData || []).map(async (profile) => {
          // Buscar email do usuário
          const { data: authData } = await supabase.auth.admin.getUserById(profile.id);
          
          // Buscar role do usuário
          const { data: roleData } = await supabase
            .from('user_roles')
            .select('role')
            .eq('user_id', profile.id)
            .single();

          return {
            ...profile,
            email: authData?.user?.email || '',
            role: roleData?.role || 'user',
            access_profile: profile.access_profiles?.[0] || undefined
          };
        })
      );

      console.log('Loaded users:', usersWithRoles);
      setUsers(usersWithRoles);
    } catch (error) {
      console.error('Erro ao carregar usuários:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar usuários",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (companyInfo?.id) {
      loadUsers();
    }
  }, [companyInfo?.id]);

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
      loadUsers();
    } catch (error) {
      console.error('Error updating user status:', error);
      toast({ title: "Erro", description: "Erro ao atualizar usuário", variant: "destructive" });
    }
  };

  // Update user profile
  const handleUpdateUserProfile = async (userId: string, profileId: string) => {
    if (!confirm('Tem certeza que deseja alterar o perfil deste usuário?')) return;
    
    try {
      // Atualizar perfil do usuário
      const { error } = await supabase
        .from('profiles')
        .update({ profile_id: profileId })
        .eq('id', userId);

      if (error) throw error;

      toast({ 
        title: "Sucesso", 
        description: "Perfil do usuário atualizado com sucesso! As novas permissões serão aplicadas no próximo login." 
      });
      loadUsers();
    } catch (error) {
      console.error('Error updating user profile:', error);
      toast({ title: "Erro", description: "Erro ao atualizar perfil", variant: "destructive" });
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
      loadUsers();
    } catch (error: any) {
      console.error('Error deleting user:', error);
      toast({ 
        title: "Erro", 
        description: error.message || "Erro ao excluir usuário", 
        variant: "destructive" 
      });
    }
  };

  // Callback após criar usuário - recarrega a lista imediatamente
  const handleUserCreated = () => {
    setIsCreateUserModalOpen(false);
    toast({
      title: "Sucesso",
      description: "Usuário criado com sucesso!",
    });
    // Recarrega a lista de usuários imediatamente
    loadUsers();
  };

  const handleDeleteUserClick = (userId: string, userName: string, userEmail: string) => {
    setDeleteUserModal({
      open: true,
      userId,
      userName,
      userEmail
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Usuários do Sistema</h3>
        <Button onClick={() => setIsCreateUserModalOpen(true)}>
          Novo Usuário
        </Button>
      </div>
      
      <CreateUserModal
        open={isCreateUserModalOpen}
        setOpen={setIsCreateUserModalOpen}
        onSuccess={handleUserCreated}
        availableProfiles={accessProfiles}
        userRole={userRole}
      />

      <DeleteUserModal
        userId={deleteUserModal.userId}
        userName={deleteUserModal.userName}
        userEmail={deleteUserModal.userEmail}
        open={deleteUserModal.open}
        onOpenChange={(open) => setDeleteUserModal(prev => ({ ...prev, open }))}
        onConfirm={handleDeleteUser}
        currentUserId={user?.id}
      />
      
      <ActiveUsersTable
        users={users}
        availableProfiles={accessProfiles}
        userRole={userRole}
        currentUserId={user?.id}
        onStatusChange={handleUpdateUserStatus}
        onProfileChange={handleUpdateUserProfile}
        onDeleteUser={handleDeleteUserClick}
        loading={loading}
      />
    </div>
  );
};
