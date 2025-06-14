import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from '@/components/Auth/AuthProvider';
import InviteUserModal from './InviteUserModal';
import UserInvitationsTable from './UserInvitationsTable';
import ActiveUsersTable from './ActiveUsersTable';
import RoleModulePermissions from './RoleModulePermissions';

// Interface definitions
interface UserInvitation {
  id: string;
  email: string;
  role: string;
  status: string;
  expires_at: string;
  created_at: string;
}

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
}

const availableRoles = [
  { value: 'user', label: 'Usuário' },
  { value: 'admin', label: 'Administrador' },
  { value: 'master', label: 'Master', masterOnly: true },
  { value: 'vendedor', label: 'Vendedor' },
  { value: 'administrativo', label: 'Administrativo' },
  { value: 'financeiro', label: 'Financeiro' },
  { value: 'producao', label: 'Produção' },
  { value: 'embalagem', label: 'Embalagem' },
  { value: 'entrega', label: 'Entrega' }
];

export const UserManagement = () => {
  const [invitations, setInvitations] = useState<UserInvitation[]>([]);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const { userRole } = useAuth();

  // Security check - only admins and masters can access
  if (userRole !== 'admin' && userRole !== 'master') {
    return (
      <div className="text-center p-4">
        <p className="text-red-500">Acesso negado. Apenas administradores podem gerenciar usuários.</p>
      </div>
    );
  }

  // Fetch invitations
  const loadInvitations = async () => {
    try {
      const { data, error } = await supabase
        .from('user_invitations')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      setInvitations(data || []);
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Erro ao carregar convites:', error);
      }
    }
  };

  // Fetch users
  const loadUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select(`
          *,
          user_roles!inner(role)
        `)
        .eq('is_active', true);

      if (error) throw error;

      const usersWithRoles = data?.map(user => ({
        ...user,
        role: user.user_roles?.[0]?.role || 'user'
      })) || [];

      setUsers(usersWithRoles);
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Erro ao carregar usuários:', error);
      }
    }
  };

  useEffect(() => {
    loadInvitations();
    loadUsers();
  }, []);

  // User invitation deleted
  const handleDeleteInvitation = async (invitationId: string) => {
    if (!confirm('Tem certeza que deseja remover este convite?')) return;
    try {
      const { error } = await supabase
        .from('user_invitations')
        .delete()
        .eq('id', invitationId);
      if (error) throw error;
      toast({ title: "Sucesso", description: "Convite removido com sucesso!" });
      loadInvitations();
    } catch {
      toast({ title: "Erro", description: "Erro ao remover convite", variant: "destructive" });
    }
  };

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
    } catch {
      toast({ title: "Erro", description: "Erro ao atualizar usuário", variant: "destructive" });
    }
  };

  // Update user role
  const handleUpdateUserRole = async (userId: string, newRole: string) => {
    if (newRole === 'master' && userRole !== 'master') {
      toast({
        title: "Erro",
        description: "Apenas usuários master podem atribuir a função master",
        variant: "destructive",
      });
      return;
    }
    if (!confirm('Tem certeza que deseja alterar a função deste usuário?')) return;
    try {
      const { error } = await supabase
        .from('user_roles')
        .update({ role: newRole })
        .eq('user_id', userId);
      if (error) throw error;
      toast({ title: "Sucesso", description: "Função do usuário atualizada com sucesso!" });
      loadUsers();
    } catch {
      toast({ title: "Erro", description: "Erro ao atualizar função", variant: "destructive" });
    }
  };

  // Invite user modal handled
  const handleInviteSent = () => {
    setIsInviteModalOpen(false);
    loadInvitations();
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Usuários do Sistema</h3>
        <Button onClick={() => setIsInviteModalOpen(true)}>
          Convidar Usuário
        </Button>
        <InviteUserModal
          open={isInviteModalOpen}
          setOpen={setIsInviteModalOpen}
          onSuccess={handleInviteSent}
          availableRoles={availableRoles}
          userRole={userRole}
        />
      </div>
      {/* Mostra as permissões de módulos por perfil (SOMENTE MASTER) */}
      {userRole === "master" && (
        <div>
          <RoleModulePermissions />
        </div>
      )}
      <UserInvitationsTable
        invitations={invitations}
        onDelete={handleDeleteInvitation}
      />
      <ActiveUsersTable
        users={users}
        availableRoles={availableRoles}
        userRole={userRole}
        onStatusChange={handleUpdateUserStatus}
        onRoleChange={handleUpdateUserRole}
      />
    </div>
  );
};
