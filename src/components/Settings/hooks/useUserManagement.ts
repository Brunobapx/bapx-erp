
import { useState, useEffect } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from '@/components/Auth/AuthProvider';

// Interface definitions
export interface UserProfile {
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
  profile_id?: string;
  access_profile?: {
    name: string;
    description: string;
  } | null;
}

export const useUserManagement = () => {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const { companyInfo } = useAuth();

  // Fetch users with improved query
  const loadUsers = async () => {
    try {
      setLoading(true);
      console.log('Loading users for company:', companyInfo?.id);
      
      if (!companyInfo?.id) {
        console.warn('No company ID available');
        setUsers([]);
        return;
      }

      // Query otimizada com LEFT JOIN direto
      const { data: usersData, error: usersError } = await supabase
        .from('profiles')
        .select(`
          id,
          first_name,
          last_name,
          phone,
          department,
          position,
          is_active,
          last_login,
          profile_id,
          access_profiles:profile_id (
            name,
            description
          )
        `)
        .eq('company_id', companyInfo.id);

      if (usersError) {
        console.error('Error fetching users:', usersError);
        throw usersError;
      }

      console.log('Raw users data:', usersData);

      if (!usersData || usersData.length === 0) {
        console.log('No users found for company');
        setUsers([]);
        return;
      }

      // Buscar roles dos usuários
      const userIds = usersData.map(user => user.id);
      const { data: rolesData } = await supabase
        .from('user_roles')
        .select('user_id, role')
        .in('user_id', userIds);

      console.log('Roles data:', rolesData);

      // Mapear dados dos usuários com correção do tipo
      const processedUsers: UserProfile[] = usersData.map((profile) => {
        const userRole = rolesData?.find(r => r.user_id === profile.id);
        
        // Corrigir o access_profile - pode ser null ou um objeto
        let accessProfile = null;
        if (profile.access_profiles && Array.isArray(profile.access_profiles) && profile.access_profiles.length > 0) {
          accessProfile = profile.access_profiles[0];
        } else if (profile.access_profiles && !Array.isArray(profile.access_profiles)) {
          accessProfile = profile.access_profiles;
        }

        const user: UserProfile = {
          ...profile,
          email: `user-${profile.id.substring(0, 8)}@system.local`, // Fallback temporário
          role: userRole?.role || 'user',
          access_profile: accessProfile
        };

        return user;
      });

      console.log('Final processed users:', processedUsers);
      setUsers(processedUsers);
    } catch (error) {
      console.error('Erro ao carregar usuários:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar usuários",
        variant: "destructive",
      });
      setUsers([]); // Garantir que lista não fica em estado indefinido
    } finally {
      setLoading(false);
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
    setUsers
  };
};
