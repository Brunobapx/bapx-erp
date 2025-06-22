import React, { useState } from 'react';
import { useAuth } from '@/components/Auth/AuthProvider';
import { useSimpleUserManagement } from '@/hooks/useSimpleUserManagement';
import { useSimpleProfiles } from '@/hooks/useSimpleProfiles';
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

import { UserManagementHeader } from './UserManagement/UserManagementHeader';
import { UserManagementStats } from './UserManagement/UserManagementStats';
import SimpleUsersTable from './SimpleUsersTable';
import CreateUserModal from './CreateUser/CreateUserModal';
import { EditUserModal } from './EditUserModal';
import { DeleteUserModal } from './DeleteUserModal';

export const UserManagement = () => {
  const { user, userRole } = useAuth();
  const currentUserId = user?.id;
  const { users, loading, loadUsers, updateUserStatus, updateUserRole, updateUserProfile } = useSimpleUserManagement();
  const { profiles: availableProfiles } = useSimpleProfiles();
  const { toast } = useToast();

  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [userToDelete, setUserToDelete] = useState({ id: '', name: '', email: '' });

  const handleEditUser = (user) => {
    setSelectedUser(user);
    setEditModalOpen(true);
  };

  const handleDeleteUser = (userId, userName, userEmail = '') => {
    setUserToDelete({ id: userId, name: userName, email: userEmail });
    setDeleteModalOpen(true);
  };

  const confirmDeleteUser = async (userId) => {
    try {
      const { error } = await supabase.functions.invoke('delete-user', {
        body: { userId },
        headers: { 'x-requester-role': userRole },
      });

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Usuário excluído com sucesso!",
      });

      await loadUsers();
    } catch (error) {
      console.error('Erro ao excluir usuário:', error);
      toast({
        title: "Erro",
        description: error.message || "Erro ao excluir usuário",
        variant: "destructive",
      });
    }
  };

  const handleModalSuccess = async () => {
    await loadUsers();
    setCreateModalOpen(false);
    setEditModalOpen(false);
    setSelectedUser(null);
  };

  if (!userRole || (userRole !== 'admin' && userRole !== 'master')) {
    return (
      <div className="text-center p-8">
        <p>Você não tem permissão para acessar esta funcionalidade.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <UserManagementHeader
        usersCount={users.length}
        loading={loading}
        onRefresh={loadUsers}
        onNewUser={() => setCreateModalOpen(true)}
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
  );
};
