
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

export const useUserData = () => {
  const [users, setUsers] = useState<SimpleUser[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const { companyInfo } = useAuth();

  const loadUsers = async () => {
    if (!companyInfo?.id) {
      console.log('No company ID available for loading users');
      setUsers([]);
      return;
    }

    try {
      setLoading(true);
      console.log('Loading users for company:', companyInfo.id);
      
      // Query profiles directly with better error handling
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .eq('company_id', companyInfo.id);

      if (profilesError) {
        console.error('Error loading profiles:', profilesError);
        throw profilesError;
      }

      if (!profilesData || profilesData.length === 0) {
        console.log('No users found for company');
        setUsers([]);
        return;
      }

      // Get user roles in batch
      const userIds = profilesData.map(p => p.id);
      const { data: rolesData } = await supabase
        .from('user_roles')
        .select('user_id, role')
        .in('user_id', userIds);

      // Get access profiles in batch
      const profileIds = profilesData
        .filter(p => p.profile_id)
        .map(p => p.profile_id)
        .filter(Boolean);

      let accessProfilesData: any[] = [];
      if (profileIds.length > 0) {
        const { data } = await supabase
          .from('access_profiles')
          .select('id, name, description')
          .in('id', profileIds);
        
        accessProfilesData = data || [];
      }

      // Process users with sanitization
      const processedUsers: SimpleUser[] = profilesData.map((profile) => {
        const userRole = rolesData?.find(r => r.user_id === profile.id);
        const accessProfile = profile.profile_id 
          ? accessProfilesData.find(ap => ap.id === profile.profile_id)
          : null;
        
        return {
          id: profile.id,
          first_name: profile.first_name || '',
          last_name: profile.last_name || '',
          email: `user-${profile.id.substring(0, 8)}@sistema.local`,
          role: userRole?.role || 'user',
          is_active: profile.is_active ?? true,
          last_login: profile.last_login || '',
          department: profile.department || '',
          position: profile.position || '',
          profile_id: profile.profile_id || '',
          access_profile: accessProfile
        };
      });

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

  useEffect(() => {
    if (companyInfo?.id) {
      loadUsers();
    }
  }, [companyInfo?.id]);

  return {
    users,
    loading,
    loadUsers,
  };
};
