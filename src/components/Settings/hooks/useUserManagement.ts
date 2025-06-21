
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
  };
}

export const useUserManagement = () => {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const { companyInfo } = useAuth();

  // Fetch users
  const loadUsers = async () => {
    try {
      setLoading(true);
      console.log('Loading users for company:', companyInfo?.id);
      
      if (!companyInfo?.id) {
        console.warn('No company ID available');
        return;
      }

      // Buscar usuários da empresa atual com perfis
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
          last_login,
          profile_id,
          access_profiles!left(
            name,
            description
          )
        `)
        .eq('company_id', companyInfo.id);

      if (profilesError) {
        console.error('Error fetching profiles:', profilesError);
        throw profilesError;
      }

      console.log('Raw profiles data:', profilesData);

      // Buscar emails e roles dos usuários
      const usersWithRoles = await Promise.all(
        (profilesData || []).map(async (profile) => {
          try {
            // Buscar email do usuário
            const { data: authData } = await supabase.auth.admin.getUserById(profile.id);
            
            // Buscar role do usuário
            const { data: roleData } = await supabase
              .from('user_roles')
              .select('role')
              .eq('user_id', profile.id)
              .single();

            const user: UserProfile = {
              ...profile,
              email: authData?.user?.email || '',
              role: roleData?.role || 'user',
              access_profile: Array.isArray(profile.access_profiles) && profile.access_profiles.length > 0 
                ? profile.access_profiles[0] 
                : undefined
            };

            console.log('Processed user:', user);
            return user;
          } catch (error) {
            console.error('Error processing user:', profile.id, error);
            return {
              ...profile,
              email: '',
              role: 'user',
              access_profile: undefined
            };
          }
        })
      );

      console.log('Final users with roles:', usersWithRoles);
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

  return {
    users,
    loading,
    loadUsers,
    setUsers
  };
};
