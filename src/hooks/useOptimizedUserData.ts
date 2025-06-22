
import { useState, useEffect, useCallback } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from '@/components/Auth/AuthProvider';

export interface OptimizedUser {
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

// Cache simples em memória com TTL
const cache = new Map<string, { data: OptimizedUser[]; timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutos

export const useOptimizedUserData = () => {
  const [users, setUsers] = useState<OptimizedUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const { companyInfo } = useAuth();

  const getCacheKey = (companyId: string) => `users_${companyId}`;

  const loadUsersFromCache = useCallback((companyId: string): OptimizedUser[] | null => {
    const cacheKey = getCacheKey(companyId);
    const cached = cache.get(cacheKey);
    
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      console.log('Loading users from cache');
      return cached.data;
    }
    
    return null;
  }, []);

  const saveUsersToCache = useCallback((companyId: string, data: OptimizedUser[]) => {
    const cacheKey = getCacheKey(companyId);
    cache.set(cacheKey, { data, timestamp: Date.now() });
  }, []);

  const loadUsers = useCallback(async (useCache: boolean = true): Promise<void> => {
    if (!companyInfo?.id) {
      console.log('No company ID available for loading users');
      setUsers([]);
      return;
    }

    // Tentar cache primeiro se solicitado
    if (useCache) {
      const cachedUsers = loadUsersFromCache(companyInfo.id);
      if (cachedUsers) {
        setUsers(cachedUsers);
        return;
      }
    }

    try {
      setLoading(true);
      setError(null);
      
      console.log('Loading users from database (optimized query)');
      
      // Query otimizada com JOIN único
      const { data: usersWithRoles, error: usersError } = await supabase
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
        .eq('company_id', companyInfo.id)
        .order('first_name');

      if (usersError) {
        console.error('Error loading users:', usersError);
        throw usersError;
      }

      const processedUsers: OptimizedUser[] = (usersWithRoles || []).map((user) => {
        // Fix: user_roles is an array, get the first role
        const userRole = Array.isArray(user.user_roles) && user.user_roles.length > 0 
          ? user.user_roles[0].role 
          : 'user';
        
        // Fix: access_profiles can be an array or null, get first item if array
        const accessProfile = user.access_profiles
          ? Array.isArray(user.access_profiles) && user.access_profiles.length > 0
            ? user.access_profiles[0]
            : user.access_profiles
          : null;

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
          access_profile: accessProfile
        };
      });

      setUsers(processedUsers);
      saveUsersToCache(companyInfo.id, processedUsers);
      
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
  }, [companyInfo?.id, toast, loadUsersFromCache, saveUsersToCache]);

  const refreshUsers = useCallback(async (): Promise<void> => {
    await loadUsers(false); // Força reload sem cache
  }, [loadUsers]);

  const invalidateCache = useCallback(() => {
    if (companyInfo?.id) {
      const cacheKey = getCacheKey(companyInfo.id);
      cache.delete(cacheKey);
    }
  }, [companyInfo?.id, getCacheKey]);

  useEffect(() => {
    if (companyInfo?.id) {
      loadUsers(true);
    }
  }, [companyInfo?.id, loadUsers]);

  return {
    users,
    loading,
    error,
    loadUsers,
    refreshUsers,
    invalidateCache,
  };
};
