import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface User {
  id: string;
  email: string;
  user_metadata: {
    first_name?: string;
    last_name?: string;
    avatar_url?: string;
  };
  created_at: string;
  role?: 'admin' | 'user' | 'master';
  modules?: string[];
  moduleIds?: string[];
}

export const useUserManagement = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError(null);

      // Usar a edge function para buscar usuários reais
      const { data, error: fetchError } = await supabase.functions.invoke('get-users');

      if (fetchError) throw fetchError;

      if (data.error) throw new Error(data.error);

      setUsers(data.users || []);
    } catch (err: any) {
      console.error('Erro ao buscar usuários:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const updateUser = async (userId: string, updates: any, moduleIds?: string[]) => {
    try {
      const { data, error: updateError } = await supabase.functions.invoke('update-user', {
        body: {
          userId,
          updates,
          moduleIds
        }
      });

      if (updateError) throw updateError;

      if (data.error) throw new Error(data.error);

      toast({
        title: "Sucesso",
        description: data.message || "Usuário atualizado com sucesso!",
      });

      fetchUsers();
      return true;
    } catch (err: any) {
      console.error('Erro ao atualizar usuário:', err);
      toast({
        title: "Erro",
        description: err.message,
        variant: "destructive",
      });
      return false;
    }
  };

  const deleteUser = async (userId: string) => {
    try {
      // Deletar permissões
      await supabase
        .from('user_module_permissions')
        .delete()
        .eq('user_id', userId);

      // Deletar role
      await supabase
        .from('user_roles')
        .delete()
        .eq('user_id', userId);

      // Em produção, também deletaria do auth.users via edge function
      
      toast({
        title: "Sucesso",
        description: "Usuário removido com sucesso!",
      });

      fetchUsers();
    } catch (err: any) {
      console.error('Erro ao deletar usuário:', err);
      toast({
        title: "Erro",
        description: err.message,
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  return {
    users,
    loading,
    error,
    refetch: fetchUsers,
    updateUser,
    deleteUser
  };
};