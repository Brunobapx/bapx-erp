
import { useState, useEffect } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from '@/components/Auth/AuthProvider';
import { SimpleUser } from '@/types/user';

export const useUserDataRefactored = () => {
  const [users, setUsers] = useState<SimpleUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const { companyInfo } = useAuth();

  const loadUsers = async (): Promise<void> => {
    if (!companyInfo?.id) {
      console.log('No company ID available for loading users');
      setUsers([]);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      console.log('Loading users for company:', companyInfo.id);
      
      // Query profiles with error handling
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .eq('company_id', companyInfo.id);

      if (profilesError) {
        console.error('Error loading profiles:', profilesError);
        throw profilesError;
      }

      console.log('Profiles loaded:', profilesData?.length || 0);

      if (!profilesData || profilesData.length === 0) {
        console.log('No users found for company');
        setUsers([]);
        return;
      }

      // Get user roles in batch
      const userIds = profilesData.map(p => p.id);
      console.log('Loading roles for users:', userIds.length);
      
      const { data: rolesData } = await supabase
        .from('user_roles')
        .select('user_id, role')
        .in('user_id', userIds);

      console.log('Roles loaded:', rolesData?.length || 0);

      // Get access profiles in batch
      const profileIds = profilesData
        .filter(p => p.profile_id)
        .map(p => p.profile_id)
        .filter(Boolean);

      let accessProfilesData: any[] = [];
      if (profileIds.length > 0) {
        console.log('Loading access profiles:', profileIds.length);
        
        const { data } = await supabase
          .from('access_profiles')
          .select('id, name, description')
          .in('id', profileIds);
        
        accessProfilesData = data || [];
        console.log('Access profiles loaded:', accessProfilesData.length);
      }

      // Get real email addresses using RPC call to fetch from auth.users
      console.log('Loading real email addresses...');
      const { data: usersWithEmails } = await supabase.rpc('get_company_users', {
        company_id_param: companyInfo.id
      });

      console.log('Users with emails loaded:', usersWithEmails?.length || 0);

      // Process users with enhanced security and real emails
      const processedUsers: SimpleUser[] = profilesData.map((profile) => {
        const userRole = rolesData?.find(r => r.user_id === profile.id);
        const accessProfile = profile.profile_id 
          ? accessProfilesData.find(ap => ap.id === profile.profile_id)
          : null;
        
        // Try to get real email from RPC function result
        const userWithEmail = usersWithEmails?.find(u => u.id === profile.id);
        const realEmail = userWithEmail?.email || `user-${profile.id.substring(0, 8)}@sistema.local`;
        
        return {
          id: profile.id,
          first_name: profile.first_name || '',
          last_name: profile.last_name || '',
          email: realEmail,
          role: userRole?.role || 'user',
          is_active: profile.is_active ?? true,
          last_login: profile.last_login || '',
          department: profile.department || '',
          position: profile.position || '',
          profile_id: profile.profile_id || '',
          company_id: profile.company_id || '',
          access_profile: accessProfile
        };
      });

      console.log('Processed users:', processedUsers.length);
      setUsers(processedUsers);
    } catch (error: any) {
      console.error('Error loading users:', error);
      const errorMessage = error.message || "Erro ao carregar usuários";
      setError(errorMessage);
      toast({
        title: "Erro",
        description: errorMessage,
        variant: "destructive",
      });
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  const refreshUsers = async (): Promise<void> => {
    await loadUsers();
  };

  useEffect(() => {
    if (companyInfo?.id) {
      console.log('Company ID available, loading users');
      loadUsers();
    } else {
      console.log('No company ID, waiting...');
    }
  }, [companyInfo?.id]);

  return {
    users,
    loading,
    error,
    loadUsers,
    refreshUsers,
  };
};
