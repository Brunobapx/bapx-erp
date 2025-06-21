
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from '@/components/Auth/AuthProvider';
import { useProfiles } from '@/hooks/useProfiles';
import ActiveUsersTable from './ActiveUsersTable';
import { UserManagementModals } from './UserManagementModals';
import { useUserManagement } from './hooks/useUserManagement';
import { useUserActions } from './hooks/useUserActions';

export const UserManagement = () => {
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
  
  const { toast } = useToast();
  const { userRole, user } = useAuth();
  const { profiles: accessProfiles, loading: profilesLoading } = useProfiles();
  const { users, loading: usersLoading, loadUsers } = useUserManagement();
  const { 
    handleUpdateUserStatus, 
    handleUpdateUserProfile, 
    handleDeleteUser 
  } = useUserActions(loadUsers);

  // Security check - only admins and masters can access
  if (userRole !== 'admin' && userRole !== 'master') {
    return (
      <div className="text-center p-4">
        <p className="text-red-500">Acesso negado. Apenas administradores podem gerenciar usuários.</p>
      </div>
    );
  }

  // Callback após criar usuário - recarrega a lista imediatamente
  const handleUserCreated = async () => {
    setIsCreateUserModalOpen(false);
    toast({
      title: "Sucesso",
      description: "Usuário criado com sucesso!",
    });
    // Recarrega a lista de usuários imediatamente
    await loadUsers();
  };

  const handleDeleteUserClick = (userId: string, userName: string, userEmail: string) => {
    setDeleteUserModal({
      open: true,
      userId,
      userName,
      userEmail
    });
  };

  const isLoading = usersLoading || profilesLoading;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Usuários do Sistema</h3>
        <Button onClick={() => setIsCreateUserModalOpen(true)}>
          Novo Usuário
        </Button>
      </div>
      
      <UserManagementModals
        isCreateUserModalOpen={isCreateUserModalOpen}
        setIsCreateUserModalOpen={setIsCreateUserModalOpen}
        deleteUserModal={deleteUserModal}
        setDeleteUserModal={setDeleteUserModal}
        availableProfiles={accessProfiles}
        userRole={userRole}
        currentUserId={user?.id}
        onUserCreated={handleUserCreated}
        onDeleteUser={handleDeleteUser}
      />
      
      <ActiveUsersTable
        users={users}
        availableProfiles={accessProfiles}
        userRole={userRole}
        currentUserId={user?.id}
        onStatusChange={handleUpdateUserStatus}
        onProfileChange={handleUpdateUserProfile}
        onDeleteUser={handleDeleteUserClick}
        loading={isLoading}
      />
    </div>
  );
};
