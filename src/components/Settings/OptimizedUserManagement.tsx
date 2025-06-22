
import React, { useState } from 'react';
import { useAuth } from '@/components/Auth/AuthProvider';
import { useOptimizedUserData } from '@/hooks/useOptimizedUserData';
import { useSimpleProfiles } from '@/hooks/useSimpleProfiles';
import { useUserCrud } from '@/hooks/useUserCrud';
import { useUserPermissions } from '@/hooks/useUserPermissions';
import { useToast } from "@/hooks/use-toast";

import { UserManagementHeader } from './UserManagement/UserManagementHeader';
import { UserManagementStats } from './UserManagement/UserManagementStats';
import { OptimizedUsersTable } from './OptimizedUsersTable';
import { CreateUserModal } from './CreateUser/CreateUserModal';
import { EditUserModal } from './EditUserModal';
import { DeleteUserModal } from './DeleteUserModal';
import { UserManagementErrorBoundary } from '../ErrorBoundary/UserManagementErrorBoundary';

export const OptimizedUserManagement = () => {
  const { user, userRole } = useAuth();
  const currentUserId = user?.id;
  const { users, loading, refreshUsers, invalidateCache } = useOptimizedUserData();
  const { profiles: availableProfiles } = useSimpleProfiles();
  const { deleteUser, updateUserStatus } = useUserCrud();
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

  const handleDeleteUser = (userId: string, userName: string, userEmail: string) => {
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

  const confirmDeleteUser = async (userId: string) => {
    try {
      const result = await deleteUser(userId);
      if (result.success) {
        invalidateCache(); // Limpar cache
        await refreshUsers();
        setDeleteModalOpen(false);
        setUserToDelete({ id: '', name: '', email: '' });
      }
    } catch (error) {
      console.error('Erro ao excluir usuário:', error);
    }
  };

  const handleModalSuccess = async () => {
    invalidateCache(); // Limpar cache
    await refreshUsers();
    setCreateModalOpen(false);
    setEditModalOpen(false);
    setSelectedUser(null);
  };

  const handleStatusChange = async (userId: string, isActive: boolean) => {
    try {
      const result = await updateUserStatus(userId, isActive);
      if (result.success) {
        invalidateCache(); // Limpar cache
        await refreshUsers();
      }
    } catch (error) {
      console.error('Erro ao atualizar status:', error);
    }
  };

  if (!userRole || !hasPermission('canViewUserDetails')) {
    return (
      <div className="text-center p-8" role="alert">
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

        <OptimizedUsersTable
          users={users}
          loading={loading}
          currentUserId={currentUserId}
          userRole={userRole}
          onEditUser={handleEditUser}
          onDeleteUser={handleDeleteUser}
          onStatusChange={handleStatusChange}
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
