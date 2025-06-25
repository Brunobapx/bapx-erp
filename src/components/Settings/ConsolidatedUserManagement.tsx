
import React, { useState, useCallback, useMemo } from 'react';
import { useAuth } from '@/components/Auth/AuthProvider';
import { useUnifiedUserManagement } from '@/hooks/useUnifiedUserManagement';
import { useSimpleProfiles } from '@/hooks/useSimpleProfiles';
import { useUserPermissions } from '@/hooks/useUserPermissions';
import { useToast } from "@/hooks/use-toast";

import { UserManagementHeader } from './UserManagement/UserManagementHeader';
import { UserManagementStats } from './UserManagement/UserManagementStats';
import SimpleUsersTable from './SimpleUsersTable';
import { CreateUserModal } from './CreateUser/CreateUserModal';
import EditUserModal from './EditUserModal';
import { DeleteUserModal } from './DeleteUserModal';
import { UserManagementErrorBoundary } from '../ErrorBoundary/UserManagementErrorBoundary';

// Hook customizado para gerenciar estados dos modais
const useModalStates = () => {
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [userToDelete, setUserToDelete] = useState({ id: '', name: '', email: '' });

  const resetStates = useCallback(() => {
    setCreateModalOpen(false);
    setEditModalOpen(false);
    setDeleteModalOpen(false);
    setSelectedUser(null);
    setUserToDelete({ id: '', name: '', email: '' });
  }, []);

  return {
    createModalOpen,
    setCreateModalOpen,
    editModalOpen,
    setEditModalOpen,
    deleteModalOpen,
    setDeleteModalOpen,
    selectedUser,
    setSelectedUser,
    userToDelete,
    setUserToDelete,
    resetStates,
  };
};

export const ConsolidatedUserManagement = () => {
  const { user, userRole } = useAuth();
  const currentUserId = user?.id;
  const { 
    users, 
    loading, 
    refreshUsers,
    updateUserStatus,
    updateUserRole,
    updateUserProfile,
    deleteUser
  } = useUnifiedUserManagement();
  const { profiles: availableProfiles } = useSimpleProfiles();
  const { hasPermission } = useUserPermissions();
  const { toast } = useToast();

  const {
    createModalOpen,
    setCreateModalOpen,
    editModalOpen,
    setEditModalOpen,
    deleteModalOpen,
    setDeleteModalOpen,
    selectedUser,
    setSelectedUser,
    userToDelete,
    setUserToDelete,
    resetStates,
  } = useModalStates();

  // Handlers otimizados com useCallback
  const handleEditUser = useCallback((user) => {
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
  }, [hasPermission, toast]);

  const handleDeleteUser = useCallback((userId, userName, userEmail = '') => {
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
  }, [hasPermission, toast]);

  const confirmDeleteUser = useCallback(async (userId) => {
    try {
      const success = await deleteUser(userId);
      if (success) {
        setDeleteModalOpen(false);
        setUserToDelete({ id: '', name: '', email: '' });
      }
    } catch (error) {
      console.error('Erro ao excluir usuário:', error);
    }
  }, [deleteUser]);

  const handleModalSuccess = useCallback(async () => {
    await refreshUsers();
    resetStates();
  }, [refreshUsers, resetStates]);

  // Memoizar verificação de permissões
  const canAccess = useMemo(() => 
    userRole && hasPermission('canViewUserDetails'), 
    [userRole, hasPermission]
  );

  if (!canAccess) {
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
