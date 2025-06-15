
import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from '@/components/Auth/AuthProvider';
import ActiveUsersTable from './ActiveUsersTable';
import CreateUserModal from './CreateUserModal';

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
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [isCreateUserModalOpen, setIsCreateUserModalOpen] = useState(false);
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
    loadUsers();
  }, []);

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

  // Callback após criar usuário
  const handleUserCreated = () => {
    setIsCreateUserModalOpen(false);
    loadUsers();
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Usuários do Sistema</h3>
        <Button onClick={() => setIsCreateUserModalOpen(true)}>
          Novo Usuário
        </Button>
        <CreateUserModal
          open={isCreateUserModalOpen}
          setOpen={setIsCreateUserModalOpen}
          onSuccess={handleUserCreated}
          availableRoles={availableRoles}
          userRole={userRole}
        />
      </div>
      {/* SESSÃO DE PERMISSÕES FOI REMOVIDA DAQUI */}
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
