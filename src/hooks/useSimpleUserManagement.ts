
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
      
      if (!companyInfo?.id) {
        setUsers([]);
        return;
      }

      // Buscar usuários da empresa com perfis de acesso
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select(`
          id, 
          first_name, 
          last_name, 
          is_active, 
          last_login, 
          department, 
          position,
          profile_id,
          access_profiles:profile_id (
            name,
            description
          )
        `)
        .eq('company_id', companyInfo.id);

      if (profilesError) throw profilesError;

      if (!profilesData || profilesData.length === 0) {
        setUsers([]);
        return;
      }

      // Buscar emails reais da tabela auth.users via RPC
      const { data: emailsData } = await supabase.rpc('get_company_users', {
        company_id_param: companyInfo.id
      });

      // Buscar roles dos usuários
      const userIds = profilesData.map(user => user.id);
      const { data: rolesData } = await supabase
        .from('user_roles')
        .select('user_id, role')
        .in('user_id', userIds);

      // Combinar dados
      const processedUsers: SimpleUser[] = profilesData.map((profile) => {
        const userRole = rolesData?.find(r => r.user_id === profile.id);
        const userEmail = emailsData?.find((e: any) => e.id === profile.id);
        
        // Corrigir o access_profile
        let accessProfile = null;
        if (profile.access_profiles && Array.isArray(profile.access_profiles) && profile.access_profiles.length > 0) {
          accessProfile = profile.access_profiles[0];
        } else if (profile.access_profiles && !Array.isArray(profile.access_profiles)) {
          accessProfile = profile.access_profiles;
        }
        
        return {
          ...profile,
          email: userEmail?.email || `user-${profile.id.substring(0, 8)}@sistema.local`,
          role: userRole?.role || 'user',
          last_login: profile.last_login || '',
          access_profile: accessProfile
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
