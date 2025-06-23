
import React, { useState } from 'react';
import { useAuth } from '@/components/Auth/AuthProvider';
import { useUserDataRefactored } from '@/hooks/useUserDataRefactored';
import { useSimpleProfiles } from '@/hooks/useSimpleProfiles';
import { useUserCrud } from '@/hooks/useUserCrud';
import { useUserPermissions } from '@/hooks/useUserPermissions';
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

import { UserManagementHeader } from './UserManagement/UserManagementHeader';
import { UserManagementStats } from './UserManagement/UserManagementStats';
import SimpleUsersTable from './SimpleUsersTable';
import { CreateUserModal } from './CreateUser/CreateUserModal';
import { EditUserModal } from './EditUserModal';
import { DeleteUserModal } from './DeleteUserModal';
import { UserManagementErrorBoundary } from '../ErrorBoundary/UserManagementErrorBoundary';

export const UserManagement = () => {
  const { user, userRole } = useAuth();
  const currentUserId = user?.id;
  const { users, loading, refreshUsers } = useUserDataRefactored();
  const { profiles: availableProfiles } = useSimpleProfiles();
  const { deleteUser } = useUserCrud();
  const { hasPermission } = useUserPermissions();
  const { toast } = useToast();

  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [userToDelete, setUserToDelete] = useState({ id: '', name: '', email: '' });

  const handleEditUser = (user) => {
    if (!hasPermission('canEditUsers')) {
      toast({
        title: "Erro",
        description: "Você não tem permissão para editar usuários",
        variant: "destructive",
      });
      return;
    }
    setSelectedUser(user);
    setEditModalOpen(true);
  };

  const handleDeleteUser = (userId, userName, userEmail = '') => {
    if (!hasPermission('canDeleteUsers')) {
      toast({
        title: "Erro",
        description: "Você não tem permissão para excluir usuários",
        variant: "destructive",
      });
      return;
    }
    setUserToDelete({ id: userId, name: userName, email: userEmail });
    setDeleteModalOpen(true);
  };

  const confirmDeleteUser = async (userId) => {
    try {
      const result = await deleteUser(userId);
      if (result.success) {
        await refreshUsers();
        setDeleteModalOpen(false);
        setUserToDelete({ id: '', name: '', email: '' });
      }
    } catch (error) {
      console.error('Erro ao excluir usuário:', error);
    }
  };

  const handleModalSuccess = async () => {
    await refreshUsers();
    setCreateModalOpen(false);
    setEditModalOpen(false);
    setSelectedUser(null);
  };

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
      
      await refreshUsers();
    } catch (error) {
      console.error('Error updating user status:', error);
      toast({ 
        title: "Erro", 
        description: "Erro ao atualizar status do usuário", 
        variant: "destructive" 
      });
    }
  };

  const updateUserRole = async (userId: string, role: string) => {
    try {
      const { error } = await supabase
        .from('user_roles')
        .update({ role })
        .eq('user_id', userId);

      if (error) throw error;

      toast({ 
        title: "Sucesso", 
        description: "Papel do usuário atualizado com sucesso!" 
      });
      
      await refreshUsers();
    } catch (error) {
      console.error('Error updating user role:', error);
      toast({ 
        title: "Erro", 
        description: "Erro ao atualizar papel do usuário", 
        variant: "destructive" 
      });
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
      
      await refreshUsers();
    } catch (error) {
      console.error('Error updating user profile:', error);
      toast({ 
        title: "Erro", 
        description: "Erro ao atualizar perfil de acesso do usuário", 
        variant: "destructive" 
      });
    }
  };

  if (!userRole || !hasPermission('canViewUserDetails')) {
    return (
      <div className="text-center p-8">
        <p>Você não tem permissão para acessar esta funcionalidade.</p>
      </div>
    );
  }

  return (
    <UserManagementErrorBoundary>
      <div className="space-y-6">
        <UserManagementHeader
          usersCount={users.length}
          loading={loading}
          onRefresh={refreshUsers}
          onNewUser={() => setCreateModalOpen(true)}
          canCreateUsers={hasPermission('canCreateUsers')}
        />

        <UserManagementStats users={users} />

        <SimpleUsersTable
          users={users}
          userRole={userRole}
          currentUserId={currentUserId}
          onStatusChange={updateUserStatus}
          onRoleChange={updateUserRole}
          onProfileChange={updateUserProfile}
          onDeleteUser={handleDeleteUser}
          onEditUser={handleEditUser}
          loading={loading}
          availableProfiles={availableProfiles}
        />

        <CreateUserModal
          open={createModalOpen}
          setOpen={setCreateModalOpen}
          onSuccess={handleModalSuccess}
          availableProfiles={availableProfiles}
          userRole={userRole}
        />

        <EditUserModal
          user={selectedUser}
          open={editModalOpen}
          onOpenChange={setEditModalOpen}
          onSuccess={handleModalSuccess}
          availableProfiles={availableProfiles}
          userRole={userRole}
        />

        <DeleteUserModal
          userId={userToDelete.id}
          userName={userToDelete.name}
          userEmail={userToDelete.email}
          open={deleteModalOpen}
          onOpenChange={setDeleteModalOpen}
          onConfirm={confirmDeleteUser}
          currentUserId={currentUserId}
        />
      </div>
    </UserManagementErrorBoundary>
  );
};
