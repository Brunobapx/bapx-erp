
import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from '@/components/Auth/AuthProvider';

export interface UnifiedUser {
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

// Cache com TTL de 5 minutos
const cache = new Map<string, { data: UnifiedUser[]; timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000;

export const useUnifiedUserManagement = () => {
  const [users, setUsers] = useState<UnifiedUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const { companyInfo } = useAuth();

  const getCacheKey = useCallback((companyId: string) => `users_${companyId}`, []);

  const loadFromCache = useCallback((companyId: string): UnifiedUser[] | null => {
    const cacheKey = getCacheKey(companyId);
    const cached = cache.get(cacheKey);
    
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      console.log('[UnifiedUserManagement] Loading from cache');
      return cached.data;
    }
    
    return null;
  }, [getCacheKey]);

  const saveToCache = useCallback((companyId: string, data: UnifiedUser[]) => {
    const cacheKey = getCacheKey(companyId);
    cache.set(cacheKey, { data, timestamp: Date.now() });
  }, [getCacheKey]);

  const loadUsers = useCallback(async (useCache: boolean = true): Promise<void> => {
    if (!companyInfo?.id) {
      console.log('[UnifiedUserManagement] No company ID available');
      setUsers([]);
      return;
    }

    // Tentar cache primeiro
    if (useCache) {
      const cachedUsers = loadFromCache(companyInfo.id);
      if (cachedUsers) {
        setUsers(cachedUsers);
        return;
      }
    }

    try {
      setLoading(true);
      setError(null);
      
      console.log('[UnifiedUserManagement] Loading users from database');
      
      // Primeira consulta: buscar perfis
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select(`
          id,
          first_name,
          last_name,
          department,
          position,
          is_active,
          last_login,
          profile_id,
          access_profiles(name, description)
        `)
        .eq('company_id', companyInfo.id)
        .order('first_name');

      if (profilesError) {
        console.error('[UnifiedUserManagement] Error loading profiles:', profilesError);
        throw profilesError;
      }

      // Segunda consulta: buscar roles dos usuários
      const userIds = (profilesData || []).map(profile => profile.id);
      const { data: rolesData, error: rolesError } = await supabase
        .from('user_roles')
        .select('user_id, role')
        .in('user_id', userIds)
        .eq('company_id', companyInfo.id);

      if (rolesError) {
        console.error('[UnifiedUserManagement] Error loading roles:', rolesError);
        throw rolesError;
      }

      // Criar mapa de roles para fácil acesso
      const rolesMap = new Map<string, string>();
      (rolesData || []).forEach(roleData => {
        rolesMap.set(roleData.user_id, roleData.role);
      });

      const processedUsers: UnifiedUser[] = (profilesData || []).map((profile) => {
        // Buscar role do usuário
        const userRole = rolesMap.get(profile.id) || 'user';
        
        // Normalizar access_profile
        let accessProfile: { name: string; description: string; } | null = null;
        
        if (profile.access_profiles) {
          const profiles = profile.access_profiles as any;
          
          if (Array.isArray(profiles) && profiles.length > 0) {
            accessProfile = {
              name: profiles[0]?.name || '',
              description: profiles[0]?.description || ''
            };
          } else if (typeof profiles === 'object' && profiles.name !== undefined) {
            accessProfile = {
              name: profiles.name || '',
              description: profiles.description || ''
            };
          }
        }

        return {
          id: profile.id,
          first_name: profile.first_name || '',
          last_name: profile.last_name || '',
          email: `user-${profile.id.substring(0, 8)}@sistema.local`,
          role: userRole,
          is_active: profile.is_active ?? true,
          last_login: profile.last_login || '',
          department: profile.department || '',
          position: profile.position || '',
          profile_id: profile.profile_id || '',
          access_profile: accessProfile
        };
      });

      setUsers(processedUsers);
      saveToCache(companyInfo.id, processedUsers);
      
    } catch (error: any) {
      console.error('[UnifiedUserManagement] Error loading users:', error);
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
  }, [companyInfo?.id, toast, loadFromCache, saveToCache]);

  const refreshUsers = useCallback(async (): Promise<void> => {
    await loadUsers(false); // Força reload sem cache
  }, [loadUsers]);

  const invalidateCache = useCallback(() => {
    if (companyInfo?.id) {
      const cacheKey = getCacheKey(companyInfo.id);
      cache.delete(cacheKey);
    }
  }, [companyInfo?.id, getCacheKey]);

  // User actions
  const updateUserStatus = useCallback(async (userId: string, isActive: boolean): Promise<boolean> => {
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
      
      invalidateCache();
      await refreshUsers();
      return true;
    } catch (error: any) {
      console.error('[UnifiedUserManagement] Error updating user status:', error);
      toast({ 
        title: "Erro", 
        description: "Erro ao atualizar status do usuário", 
        variant: "destructive" 
      });
      return false;
    }
  }, [toast, invalidateCache, refreshUsers]);

  const updateUserRole = useCallback(async (userId: string, role: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('user_roles')
        .upsert({ user_id: userId, role, company_id: companyInfo?.id });

      if (error) throw error;

      toast({ 
        title: "Sucesso", 
        description: "Papel do usuário atualizado com sucesso!" 
      });
      
      invalidateCache();
      await refreshUsers();
      return true;
    } catch (error: any) {
      console.error('[UnifiedUserManagement] Error updating user role:', error);
      toast({ 
        title: "Erro", 
        description: "Erro ao atualizar papel do usuário", 
        variant: "destructive" 
      });
      return false;
    }
  }, [companyInfo?.id, toast, invalidateCache, refreshUsers]);

  const updateUserProfile = useCallback(async (userId: string, profileId: string): Promise<boolean> => {
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
      
      invalidateCache();
      await refreshUsers();
      return true;
    } catch (error: any) {
      console.error('[UnifiedUserManagement] Error updating user profile:', error);
      toast({ 
        title: "Erro", 
        description: "Erro ao atualizar perfil de acesso do usuário", 
        variant: "destructive" 
      });
      return false;
    }
  }, [toast, invalidateCache, refreshUsers]);

  const deleteUser = useCallback(async (userId: string): Promise<boolean> => {
    try {
      const { error } = await supabase.functions.invoke('delete-user', {
        body: { userId },
      });

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Usuário excluído com sucesso!",
      });

      invalidateCache();
      await refreshUsers();
      return true;
    } catch (error: any) {
      console.error('[UnifiedUserManagement] Error deleting user:', error);
      toast({
        title: "Erro",
        description: error.message || "Erro ao excluir usuário",
        variant: "destructive",
      });
      return false;
    }
  }, [toast, invalidateCache, refreshUsers]);

  // Inicializar ao montar ou quando company mudar
  useEffect(() => {
    if (companyInfo?.id) {
      console.log('[UnifiedUserManagement] Company ID available, loading users');
      loadUsers(true);
    } else {
      console.log('[UnifiedUserManagement] No company ID, waiting...');
      setUsers([]);
    }
  }, [companyInfo?.id, loadUsers]);

  // Memoizar retorno para evitar re-renders desnecessários
  const memoizedReturn = useMemo(() => ({
    users,
    loading,
    error,
    loadUsers,
    refreshUsers,
    invalidateCache,
    updateUserStatus,
    updateUserRole,
    updateUserProfile,
    deleteUser,
  }), [
    users,
    loading,
    error,
    loadUsers,
    refreshUsers,
    invalidateCache,
    updateUserStatus,
    updateUserRole,
    updateUserProfile,
    deleteUser,
  ]);

  return memoizedReturn;
};
