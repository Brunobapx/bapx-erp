import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface User {
  id: string;
  email: string;
  user_metadata: {
    first_name?: string;
    last_name?: string;
  };
  created_at: string;
  role?: 'admin' | 'user';
  modules?: string[];
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

      // Buscar usuários com suas roles e permissões
      const { data: userRoles, error: rolesError } = await supabase
        .from('user_roles')
        .select(`
          user_id,
          role,
          user_module_permissions (
            module_id,
            system_modules (
              id,
              name,
              route_path
            )
          )
        `);

      if (rolesError) throw rolesError;

      // Para cada usuário, buscar dados do auth.users via admin API
      const userIds = userRoles?.map(ur => ur.user_id) || [];
      
      if (userIds.length > 0) {
        // Como não podemos acessar auth.users diretamente, vamos simular os dados
        // Em produção, isso seria feito via edge function administrativa
        const enrichedUsers = userRoles?.map(userRole => ({
          id: userRole.user_id,
          email: `user${userRole.user_id.slice(0, 8)}@example.com`, // Placeholder
          user_metadata: {
            first_name: 'Nome',
            last_name: 'Sobrenome'
          },
          created_at: new Date().toISOString(),
          role: userRole.role,
          modules: userRole.user_module_permissions?.map((ump: any) => ump.system_modules?.name) || []
        })) || [];

        setUsers(enrichedUsers);
      }
    } catch (err: any) {
      console.error('Erro ao buscar usuários:', err);
      setError(err.message);
    } finally {
      setLoading(false);
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
    deleteUser
  };
};