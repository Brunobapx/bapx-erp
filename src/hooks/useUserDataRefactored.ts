
import { useState, useEffect, useCallback } from 'react';
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

  const loadUsers = useCallback(async (): Promise<void> => {
    if (!companyInfo?.id) {
      console.log('[useUserDataRefactored] No company ID available');
      setUsers([]);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      console.log('[useUserDataRefactored] Loading users for company:', companyInfo.id);
      
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .eq('company_id', companyInfo.id);

      if (profilesError) {
        throw profilesError;
      }

      if (!profilesData || profilesData.length === 0) {
        setUsers([]);
        return;
      }

      // Get user roles
      const userIds = profilesData.map(p => p.id);
      const { data: rolesData } = await supabase
        .from('user_roles')
        .select('user_id, role')
        .in('user_id', userIds);

      // Get access profiles
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
          company_id: profile.company_id || '',
          access_profile: accessProfile
        };
      });

      setUsers(processedUsers);
    } catch (error: any) {
      console.error('[useUserDataRefactored] Error loading users:', error);
      setError(error.message || "Erro ao carregar usuários");
      setUsers([]);
    } finally {
      setLoading(false);
    }
  }, [companyInfo?.id, toast]);

  const refreshUsers = useCallback(async (): Promise<void> => {
    await loadUsers();
  }, [loadUsers]);

  useEffect(() => {
    if (companyInfo?.id) {
      loadUsers();
    }
  }, [companyInfo?.id, loadUsers]);

  return {
    users,
    loading,
    error,
    loadUsers,
    refreshUsers,
  };
};
