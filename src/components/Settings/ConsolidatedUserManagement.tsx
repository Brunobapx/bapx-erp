
import React, { useState, useCallback, useMemo } from 'react';
import { useAuth } from '@/components/Auth/AuthProvider';
import { useUnifiedUserManagement } from '@/hooks/useUnifiedUserManagement';
import { useSimpleProfiles } from '@/hooks/useSimpleProfiles';
import { useUserPermissions } from '@/hooks/useUserPermissions';
import { useToast } from "@/hooks/use-toast";
import { UserManagementContainer } from './UserManagement/UserManagementContainer';

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
    <UserManagementContainer
      users={users}
      availableProfiles={availableProfiles}
      userRole={userRole}
      currentUserId={currentUserId}
      loading={loading}
      onRefresh={refreshUsers}
      onStatusChange={updateUserStatus}
      onRoleChange={updateUserRole}
      onProfileChange={updateUserProfile}
      onDeleteUser={handleDeleteUser}
      onEditUser={handleEditUser}
      createModalOpen={createModalOpen}
      setCreateModalOpen={setCreateModalOpen}
      editModalOpen={editModalOpen}
      setEditModalOpen={setEditModalOpen}
      selectedUser={selectedUser}
      deleteModalOpen={deleteModalOpen}
      setDeleteModalOpen={setDeleteModalOpen}
      userToDelete={userToDelete}
      onSuccess={handleModalSuccess}
      onDeleteConfirm={confirmDeleteUser}
      canCreateUsers={hasPermission('canCreateUsers')}
    />
  );
};
