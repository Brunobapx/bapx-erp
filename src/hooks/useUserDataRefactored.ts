
import { useState, useEffect, useCallback, useMemo } from 'react';
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

  const companyId = useMemo(() => companyInfo?.id, [companyInfo?.id]);

  const loadUsers = useCallback(async (): Promise<void> => {
    if (!companyId) {
      console.log('[useUserDataRefactored] No company ID available');
      setUsers([]);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      console.log('[useUserDataRefactored] Loading users for company:', companyId);
      
      // Optimized query with single JOIN
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
          user_roles!inner(role),
          access_profiles(name, description)
        `)
        .eq('company_id', companyId)
        .order('first_name', { ascending: true });

      if (usersError) {
        throw usersError;
      }

      if (!usersData || usersData.length === 0) {
        setUsers([]);
        return;
      }

      const processedUsers: SimpleUser[] = usersData.map((user) => {
        // Handle user_roles array properly
        const userRole = Array.isArray(user.user_roles) && user.user_roles.length > 0 
          ? user.user_roles[0].role 
          : 'user';
        
        // Handle access_profiles properly
        let accessProfile: { name: string; description: string; } | null = null;
        
        if (user.access_profiles) {
          const profiles = user.access_profiles as any;
          
          if (Array.isArray(profiles) && profiles.length > 0) {
            accessProfile = {
              name: profiles[0]?.name || '',
              description: profiles[0]?.description || ''
            };
          } else if (typeof profiles === 'object' && profiles.name) {
            accessProfile = {
              name: profiles.name || '',
              description: profiles.description || ''
            };
          }
        }

        return {
          id: user.id,
          first_name: user.first_name || '',
          last_name: user.last_name || '',
          email: `user-${user.id.substring(0, 8)}@sistema.local`,
          role: userRole,
          is_active: user.is_active ?? true,
          last_login: user.last_login || '',
          department: user.department || '',
          position: user.position || '',
          profile_id: user.profile_id || '',
          company_id: companyId,
          access_profile: accessProfile
        };
      });

      setUsers(processedUsers);
    } catch (error: any) {
      console.error('[useUserDataRefactored] Error loading users:', error);
      setError(error.message || "Erro ao carregar usuários");
      setUsers([]);
      
      toast({
        title: "Erro",
        description: error.message || "Erro ao carregar usuários",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [companyId, toast]);

  const refreshUsers = useCallback(async (): Promise<void> => {
    await loadUsers();
  }, [loadUsers]);

  useEffect(() => {
    if (companyId) {
      loadUsers();
    }
  }, [companyId, loadUsers]);

  return {
    users,
    loading,
    error,
    loadUsers,
    refreshUsers,
  };
};
