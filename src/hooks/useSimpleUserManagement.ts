
import { useState, useEffect } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from '@/components/Auth/AuthProvider';

export interface SimpleUser {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  role: string;
  is_active: boolean;
  last_login: string;
  department: string;
  position: string;
}

export const useSimpleUserManagement = () => {
  const [users, setUsers] = useState<SimpleUser[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const { companyInfo } = useAuth();

  const loadUsers = async () => {
    try {
      setLoading(true);
      
      if (!companyInfo?.id) {
        setUsers([]);
        return;
      }

      // Buscar usuários da empresa
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, is_active, last_login, department, position')
        .eq('company_id', companyInfo.id);

      if (profilesError) throw profilesError;

      if (!profilesData || profilesData.length === 0) {
        setUsers([]);
        return;
      }

      // Buscar roles dos usuários
      const userIds = profilesData.map(user => user.id);
      const { data: rolesData } = await supabase
        .from('user_roles')
        .select('user_id, role')
        .in('user_id', userIds);

      // Combinar dados
      const processedUsers: SimpleUser[] = profilesData.map((profile) => {
        const userRole = rolesData?.find(r => r.user_id === profile.id);
        
        return {
          ...profile,
          email: `user-${profile.id.substring(0, 8)}@system.local`,
          role: userRole?.role || 'user',
        };
      });

      setUsers(processedUsers);
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

  const updateUserStatus = async (userId: string, isActive: boolean) => {
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
      
      await loadUsers();
    } catch (error) {
      toast({ 
        title: "Erro", 
        description: "Erro ao atualizar status do usuário", 
        variant: "destructive" 
      });
    }
  };

  const updateUserRole = async (userId: string, role: string) => {
    try {
      const { error } = await supabase
        .from('user_roles')
        .update({ role })
        .eq('user_id', userId);

      if (error) throw error;

      toast({ 
        title: "Sucesso", 
        description: "Papel do usuário atualizado com sucesso!" 
      });
      
      await loadUsers();
    } catch (error) {
      toast({ 
        title: "Erro", 
        description: "Erro ao atualizar papel do usuário", 
        variant: "destructive" 
      });
    }
  };

  useEffect(() => {
    if (companyInfo?.id) {
      loadUsers();
    }
  }, [companyInfo?.id]);

  return {
    users,
    loading,
    loadUsers,
    updateUserStatus,
    updateUserRole,
  };
};
