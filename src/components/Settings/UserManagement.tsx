
import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from '@/components/Auth/AuthProvider';
import { useSimpleUserManagement, SimpleUser } from '@/hooks/useSimpleUserManagement';
import { supabase } from '@/integrations/supabase/client';
import SimpleUsersTable from './SimpleUsersTable';
import CreateUserModal from './CreateUserModal';
import { DeleteUserModal } from './DeleteUserModal';
import { EditUserModal } from './EditUserModal';

interface AccessProfile {
  id: string;
  name: string;
  description: string;
  is_active: boolean;
}

export const UserManagement = () => {
  const [isCreateUserModalOpen, setIsCreateUserModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<SimpleUser | null>(null);
  const [deleteUserModal, setDeleteUserModal] = useState<{
    open: boolean;
    userId: string;
    userName: string;
  }>({
    open: false,
    userId: '',
    userName: ''
  });
  const [availableProfiles, setAvailableProfiles] = useState<AccessProfile[]>([]);
  const [profilesLoading, setProfilesLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  
  const { toast } = useToast();
  const { userRole, user, companyInfo } = useAuth();
  const { users, loading, loadUsers, updateUserStatus, updateUserRole, updateUserProfile } = useSimpleUserManagement();

  console.log('UserManagement render - userRole:', userRole, 'companyInfo:', companyInfo?.id);

  const loadProfiles = async () => {
    if (!companyInfo?.id) {
      console.log('No company ID for loading profiles');
      return;
    }

    try {
      setProfilesLoading(true);
      console.log('Loading profiles for company:', companyInfo.id);

      const { data, error } = await supabase
        .from('access_profiles')
        .select('id, name, description, is_active')
        .eq('company_id', companyInfo.id)
        .eq('is_active', true)
        .order('name');

      if (error) {
        console.error('Error loading profiles:', error);
        throw error;
      }

      console.log('Loaded profiles:', data);
      setAvailableProfiles(data || []);
    } catch (error) {
      console.error('Error loading profiles:', error);
      setAvailableProfiles([]);
      toast({
        title: "Aviso",
        description: "Não foi possível carregar os perfis de acesso.",
        variant: "default",
      });
    } finally {
      setProfilesLoading(false);
    }
  };

  useEffect(() => {
    console.log('UserManagement: Company info changed:', companyInfo?.id);
    if (companyInfo?.id) {
      loadProfiles();
      // Remove loading after a reasonable time even if data doesn't load
      setTimeout(() => setInitialLoading(false), 3000);
    }
  }, [companyInfo?.id]);

  useEffect(() => {
    if (!loading && users.length >= 0) {
      setInitialLoading(false);
    }
  }, [loading, users]);

  const handleUserCreated = async () => {
    setIsCreateUserModalOpen(false);
    toast({
      title: "Sucesso",
      description: "Usuário criado com sucesso!",
    });
    await loadUsers();
    await loadProfiles();
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

  const handleEditUser = (user: SimpleUser) => {
    setEditingUser(user);
  };

  const handleUserUpdated = async () => {
    await loadUsers();
    await loadProfiles();
  };

  // Check permissions after component has loaded
  const isAdmin = userRole === 'admin' || userRole === 'master';
  console.log('Permission check - isAdmin:', isAdmin, 'userRole:', userRole);

  if (!isAdmin) {
    return (
      <div className="text-center p-4">
        <p className="text-red-500">Acesso negado. Apenas administradores podem gerenciar usuários.</p>
      </div>
    );
  }

  // Show loading for initial render
  if (initialLoading) {
    return (
      <div className="text-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
        <p>Carregando configurações...</p>
      </div>
    );
  }

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
        availableProfiles={availableProfiles}
        userRole={userRole}
      />

      <EditUserModal
        user={editingUser}
        open={!!editingUser}
        onOpenChange={(open) => !open && setEditingUser(null)}
        onSuccess={handleUserUpdated}
        availableProfiles={availableProfiles}
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
        onProfileChange={updateUserProfile}
        onDeleteUser={handleDeleteUserClick}
        onEditUser={handleEditUser}
        loading={loading}
        availableProfiles={availableProfiles}
      />
    </div>
  );
};
