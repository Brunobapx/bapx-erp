
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

  console.log('[useUserDataRefactored] Hook initialized, companyInfo:', companyInfo?.id);

  const loadUsers = useCallback(async (): Promise<void> => {
    if (!companyInfo?.id) {
      console.log('[useUserDataRefactored] No company ID available for loading users');
      setUsers([]);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      console.log('[useUserDataRefactored] Loading users for company:', companyInfo.id);
      
      // Query profiles with error handling
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .eq('company_id', companyInfo.id);

      if (profilesError) {
        console.error('[useUserDataRefactored] Error loading profiles:', profilesError);
        throw profilesError;
      }

      console.log('[useUserDataRefactored] Profiles loaded:', profilesData?.length || 0);

      if (!profilesData || profilesData.length === 0) {
        console.log('[useUserDataRefactored] No users found for company');
        setUsers([]);
        return;
      }

      // Get user roles in batch
      const userIds = profilesData.map(p => p.id);
      console.log('[useUserDataRefactored] Loading roles for users:', userIds.length);
      
      const { data: rolesData } = await supabase
        .from('user_roles')
        .select('user_id, role')
        .in('user_id', userIds);

      console.log('[useUserDataRefactored] Roles loaded:', rolesData?.length || 0);

      // Get access profiles in batch
      const profileIds = profilesData
        .filter(p => p.profile_id)
        .map(p => p.profile_id)
        .filter(Boolean);

      let accessProfilesData: any[] = [];
      if (profileIds.length > 0) {
        console.log('[useUserDataRefactored] Loading access profiles:', profileIds.length);
        
        const { data } = await supabase
          .from('access_profiles')
          .select('id, name, description')
          .in('id', profileIds);
        
        accessProfilesData = data || [];
        console.log('[useUserDataRefactored] Access profiles loaded:', accessProfilesData.length);
      }

      // Try to get real email addresses using RPC call
      console.log('[useUserDataRefactored] Loading real email addresses...');
      let usersWithEmails: any[] = [];
      
      try {
        const { data } = await supabase.rpc('get_company_users', {
          company_id_param: companyInfo.id
        });
        usersWithEmails = data || [];
        console.log('[useUserDataRefactored] Users with emails loaded:', usersWithEmails.length);
      } catch (emailError) {
        console.warn('[useUserDataRefactored] Failed to load real emails, using fallback:', emailError);
      }

      // Process users with enhanced security and real emails
      const processedUsers: SimpleUser[] = profilesData.map((profile) => {
        const userRole = rolesData?.find(r => r.user_id === profile.id);
        const accessProfile = profile.profile_id 
          ? accessProfilesData.find(ap => ap.id === profile.profile_id)
          : null;
        
        // Try to get real email from RPC function result, fallback to generated email
        const userWithEmail = usersWithEmails.find(u => u.id === profile.id);
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

      console.log('[useUserDataRefactored] Processed users:', processedUsers.length);
      setUsers(processedUsers);
    } catch (error: any) {
      console.error('[useUserDataRefactored] Error loading users:', error);
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
  }, [companyInfo?.id, toast]);

  const refreshUsers = useCallback(async (): Promise<void> => {
    console.log('[useUserDataRefactored] Refreshing users...');
    await loadUsers();
  }, [loadUsers]);

  useEffect(() => {
    if (companyInfo?.id) {
      console.log('[useUserDataRefactored] Company ID available, loading users');
      loadUsers();
    } else {
      console.log('[useUserDataRefactored] No company ID, waiting...');
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
