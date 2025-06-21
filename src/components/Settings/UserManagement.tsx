
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from '@/components/Auth/AuthProvider';
import { useSimpleUserManagement } from '@/hooks/useSimpleUserManagement';
import { useProfiles } from '@/hooks/useProfiles';
import SimpleUsersTable from './SimpleUsersTable';
import CreateUserModal from './CreateUserModal';
import { DeleteUserModal } from './DeleteUserModal';
import { supabase } from '@/integrations/supabase/client';

export const UserManagement = () => {
  const [isCreateUserModalOpen, setIsCreateUserModalOpen] = useState(false);
  const [deleteUserModal, setDeleteUserModal] = useState<{
    open: boolean;
    userId: string;
    userName: string;
  }>({
    open: false,
    userId: '',
    userName: ''
  });
  
  const { toast } = useToast();
  const { userRole, user } = useAuth();
  const { users, loading, loadUsers, updateUserStatus, updateUserRole } = useSimpleUserManagement();
  const { profiles } = useProfiles();

  if (userRole !== 'admin' && userRole !== 'master') {
    return (
      <div className="text-center p-4">
        <p className="text-red-500">Acesso negado. Apenas administradores podem gerenciar usuários.</p>
      </div>
    );
  }

  const handleUserCreated = async () => {
    setIsCreateUserModalOpen(false);
    toast({
      title: "Sucesso",
      description: "Usuário criado com sucesso!",
    });
    await loadUsers();
  };

  const handleDeleteUser = async (userId: string) => {
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
    } catch (error: any) {
      toast({ 
        title: "Erro", 
        description: error.message || "Erro ao excluir usuário", 
        variant: "destructive" 
      });
    }
  };

  const handleDeleteUserClick = (userId: string, userName: string) => {
    setDeleteUserModal({
      open: true,
      userId,
      userName
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
        availableProfiles={profiles}
        userRole={userRole}
      />

      <DeleteUserModal
        userId={deleteUserModal.userId}
        userName={deleteUserModal.userName}
        userEmail=""
        open={deleteUserModal.open}
        onOpenChange={(open) => setDeleteUserModal(prev => ({ ...prev, open }))}
        onConfirm={handleDeleteUser}
        currentUserId={user?.id}
      />
      
      <SimpleUsersTable
        users={users}
        userRole={userRole}
        currentUserId={user?.id}
        onStatusChange={updateUserStatus}
        onRoleChange={updateUserRole}
        onDeleteUser={handleDeleteUserClick}
        loading={loading}
      />
    </div>
  );
};
