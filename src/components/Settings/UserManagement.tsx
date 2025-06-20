
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
  email?: string;
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
  const { userRole, companyInfo } = useAuth();

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
      setLoading(true);
      console.log('Loading users for company:', companyInfo?.id);
      
      // Buscar usuários da empresa atual
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select(`
          id,
          first_name,
          last_name,
          phone,
          department,
          position,
          is_active,
          last_login
        `)
        .eq('company_id', companyInfo?.id)
        .eq('is_active', true);

      if (profilesError) throw profilesError;

      // Buscar emails e roles dos usuários
      const usersWithRoles = await Promise.all(
        (profilesData || []).map(async (profile) => {
          // Buscar email do usuário
          const { data: authData } = await supabase.auth.admin.getUserById(profile.id);
          
          // Buscar role do usuário
          const { data: roleData } = await supabase
            .from('user_roles')
            .select('role')
            .eq('user_id', profile.id)
            .single();

          return {
            ...profile,
            email: authData?.user?.email || '',
            role: roleData?.role || 'user'
          };
        })
      );

      console.log('Loaded users:', usersWithRoles);
      setUsers(usersWithRoles);
    } catch (error) {
      console.error('Erro ao carregar usuários:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar usuários",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (companyInfo?.id) {
      loadUsers();
    }
  }, [companyInfo?.id]);

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
    } catch (error) {
      console.error('Error updating user status:', error);
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
      // Atualizar role do usuário
      const { error: roleError } = await supabase
        .from('user_roles')
        .upsert({ 
          user_id: userId, 
          role: newRole,
          company_id: companyInfo?.id 
        });

      if (roleError && !roleError.message.includes('duplicate')) {
        throw roleError;
      }

      toast({ title: "Sucesso", description: "Função do usuário atualizada com sucesso!" });
      loadUsers();
    } catch (error) {
      console.error('Error updating user role:', error);
      toast({ title: "Erro", description: "Erro ao atualizar função", variant: "destructive" });
    }
  };

  // Callback após criar usuário - recarrega a lista imediatamente
  const handleUserCreated = () => {
    setIsCreateUserModalOpen(false);
    toast({
      title: "Sucesso",
      description: "Usuário criado com sucesso!",
    });
    // Recarrega a lista de usuários imediatamente
    loadUsers();
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
        availableRoles={availableRoles}
        userRole={userRole}
      />
      
      <ActiveUsersTable
        users={users}
        availableRoles={availableRoles}
        userRole={userRole}
        onStatusChange={handleUpdateUserStatus}
        onRoleChange={handleUpdateUserRole}
        loading={loading}
      />
    </div>
  );
};
