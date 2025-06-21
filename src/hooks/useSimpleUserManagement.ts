
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
  profile_id?: string;
  access_profile?: {
    name: string;
    description: string;
  } | null;
}

export const useSimpleUserManagement = () => {
  const [users, setUsers] = useState<SimpleUser[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const { companyInfo } = useAuth();

  const loadUsers = async () => {
    try {
      setLoading(true);
      console.log('Loading users for company:', companyInfo?.id);
      
      if (!companyInfo?.id) {
        console.log('No company ID available');
        setUsers([]);
        return;
      }

      // Usar apenas a RPC que já funciona para obter usuários completos
      const { data: usersData, error: usersError } = await supabase.rpc('get_company_users', {
        company_id_param: companyInfo.id
      });

      if (usersError) {
        console.error('Error loading users via RPC:', usersError);
        throw usersError;
      }

      console.log('Users data from RPC:', usersData);

      if (!usersData || usersData.length === 0) {
        console.log('No users found');
        setUsers([]);
        return;
      }

      // Buscar dados adicionais dos perfis
      const userIds = usersData.map((user: any) => user.id);
      const { data: profilesData } = await supabase
        .from('profiles')
        .select(`
          id, 
          first_name, 
          last_name, 
          is_active, 
          last_login, 
          department, 
          position,
          profile_id
        `)
        .in('id', userIds);

      // Buscar perfis de acesso se existirem
      const profileIds = profilesData?.filter(p => p.profile_id).map(p => p.profile_id) || [];
      let accessProfilesData: any[] = [];
      
      if (profileIds.length > 0) {
        const { data } = await supabase
          .from('access_profiles')
          .select('id, name, description')
          .in('id', profileIds);
        accessProfilesData = data || [];
      }

      // Combinar todos os dados
      const processedUsers: SimpleUser[] = usersData.map((user: any) => {
        const profile = profilesData?.find(p => p.id === user.id);
        const accessProfile = profile?.profile_id 
          ? accessProfilesData.find(ap => ap.id === profile.profile_id)
          : null;
        
        return {
          id: user.id,
          first_name: profile?.first_name || '',
          last_name: profile?.last_name || '',
          email: user.email || `user-${user.id.substring(0, 8)}@sistema.local`,
          role: user.role || 'user',
          is_active: profile?.is_active ?? true,
          last_login: profile?.last_login || '',
          department: profile?.department || '',
          position: profile?.position || '',
          profile_id: profile?.profile_id || '',
          access_profile: accessProfile
        };
      });

      console.log('Processed users:', processedUsers);
      setUsers(processedUsers);
    } catch (error) {
      console.error('Error loading users:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar usuários. Tente novamente.",
        variant: "destructive",
      });
      setUsers([]);
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

  const updateUserProfile = async (userId: string, profileId: string) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ 
          profile_id: profileId || null,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId);

      if (error) throw error;

      toast({ 
        title: "Sucesso", 
        description: "Perfil de acesso do usuário atualizado com sucesso!" 
      });
      
      await loadUsers();
    } catch (error) {
      toast({ 
        title: "Erro", 
        description: "Erro ao atualizar perfil de acesso do usuário", 
        variant: "destructive" 
      });
    }
  };

  useEffect(() => {
    console.log('Company info changed:', companyInfo?.id);
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
    updateUserProfile,
  };
};
