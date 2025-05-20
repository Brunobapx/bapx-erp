
import { useState, useEffect } from 'react';
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { User } from '../types/UserTypes';

export const useUserManagement = (currentUser: { email: string } | null) => {
  const [users, setUsers] = useState<User[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isUserDialogOpen, setIsUserDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [currentSelectedUser, setCurrentSelectedUser] = useState<User | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      // Primeiro, buscar todos os usuários com suas permissões
      const { data: profiles, error } = await supabase
        .from('profiles')
        .select('*');

      if (error) throw error;

      if (profiles) {
        // Transformar os perfis em nosso formato de usuário
        const mappedUsers: User[] = profiles.map(profile => ({
          id: profile.id,
          name: `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || 'Usuário sem nome',
          email: '',  // Email não está disponível diretamente do profiles
          role: profile.role || 'user',
          isAdmin: profile.role === 'admin',
          permissions: {
            pedidos: true,
            producao: true,
            embalagem: true,
            vendas: true,
            financeiro: true,
            rotas: true,
            calendario: true,
            clientes: true,
            produtos: true,
            fornecedores: true,
            emissao_fiscal: true,
            configuracoes: profile.role === 'admin'
          }
        }));

        setUsers(mappedUsers);
      }
    } catch (error) {
      console.error('Erro ao carregar usuários:', error);
      toast.error("Erro ao carregar usuários");
    } finally {
      setLoading(false);
    }
  };

  // Filtered users based on search
  const filteredUsers = users.filter(user => 
    user.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    user.email.toLowerCase().includes(searchQuery.toLowerCase()) || 
    user.role.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleAddEditUser = async () => {
    if (!currentSelectedUser) return;
    
    try {
      if (editMode) {
        // Update existing user in database
        const { error } = await supabase
          .from('profiles')
          .update({
            first_name: currentSelectedUser.name.split(' ')[0] || '',
            last_name: currentSelectedUser.name.split(' ').slice(1).join(' ') || '',
            role: currentSelectedUser.isAdmin ? 'admin' : 'user'
          })
          .eq('id', currentSelectedUser.id);
          
        if (error) throw error;
        
        // Update user in local state
        setUsers(users.map(user => user.id === currentSelectedUser.id ? currentSelectedUser : user));
        toast.success(`Usuário ${currentSelectedUser.name} atualizado com sucesso`);
      } else {
        // Adding new user is more complicated and would require Supabase Auth
        toast.info("Para adicionar novos usuários, eles precisam se registrar no sistema primeiro");
      }
    } catch (error) {
      console.error('Erro ao salvar usuário:', error);
      toast.error("Erro ao salvar usuário");
    } finally {
      handleCloseDialog();
    }
  };

  const handleDeleteUser = async () => {
    if (currentSelectedUser) {
      try {
        // Não permitir excluir o próprio usuário atual
        if (currentUser && currentSelectedUser.email === currentUser.email) {
          toast.error("Você não pode excluir seu próprio usuário");
          return;
        }

        // Note: In a real system, we'd need to delete the Auth user as well
        const { error } = await supabase
          .from('profiles')
          .delete()
          .eq('id', currentSelectedUser.id);
          
        if (error) throw error;
        
        setUsers(users.filter(user => user.id !== currentSelectedUser.id));
        toast.success(`Usuário ${currentSelectedUser.name} excluído com sucesso`);
      } catch (error) {
        console.error('Erro ao excluir usuário:', error);
        toast.error("Erro ao excluir usuário");
      } finally {
        setIsDeleteDialogOpen(false);
      }
    }
  };

  const handleOpenEditUserDialog = (user: User) => {
    setCurrentSelectedUser({...user});
    setEditMode(true);
    setIsUserDialogOpen(true);
  };

  const handleOpenDeleteDialog = (user: User) => {
    setCurrentSelectedUser(user);
    setIsDeleteDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsUserDialogOpen(false);
    setCurrentSelectedUser(null);
  };

  const handleToggleAdmin = async (user: User) => {
    try {
      // Não permitir remover privilégios de administrador do próprio usuário
      if (currentUser && user.email === currentUser.email && user.isAdmin) {
        toast.error("Você não pode remover seus próprios privilégios de administrador");
        return;
      }
      
      const updatedUser = { ...user, isAdmin: !user.isAdmin, role: !user.isAdmin ? 'admin' : 'user' };
      
      // Atualizar no banco de dados
      const { error } = await supabase
        .from('profiles')
        .update({ role: updatedUser.role })
        .eq('id', user.id);
        
      if (error) throw error;
      
      // Atualizar na interface
      setUsers(users.map(u => u.id === user.id ? updatedUser : u));
      
      const action = updatedUser.isAdmin ? "concedidos" : "removidos";
      toast.success(`Privilégios de administrador ${action} para ${user.name}`);
    } catch (error) {
      console.error('Erro ao alterar privilégios de administrador:', error);
      toast.error("Erro ao alterar privilégios de administrador");
    }
  };

  return {
    users: filteredUsers,
    searchQuery,
    setSearchQuery,
    isUserDialogOpen,
    isDeleteDialogOpen,
    currentSelectedUser,
    setCurrentSelectedUser,
    loading,
    handleAddEditUser,
    handleDeleteUser,
    handleOpenEditUserDialog,
    handleOpenDeleteDialog,
    handleCloseDialog,
    handleToggleAdmin,
    setIsUserDialogOpen,
    setIsDeleteDialogOpen
  };
};
