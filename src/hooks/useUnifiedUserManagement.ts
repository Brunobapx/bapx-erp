
import { useState, useEffect, useCallback, useMemo } from 'react';
import { useToast } from "@/hooks/use-toast";
import { useAuth } from '@/components/Auth/AuthProvider';
import { UnifiedUser } from './userManagement/types';
import { userCacheUtils } from './userManagement/userCache';
import { userDataService } from './userManagement/userDataService';
import { userActionsService } from './userManagement/userActionsService';

export type { UnifiedUser } from './userManagement/types';

export const useUnifiedUserManagement = () => {
  const [users, setUsers] = useState<UnifiedUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const { companyInfo } = useAuth();

  const loadUsers = useCallback(async (useCache: boolean = true): Promise<void> => {
    if (!companyInfo?.id) {
      console.log('[UnifiedUserManagement] No company ID available');
      setUsers([]);
      return;
    }

    // Try cache first
    if (useCache) {
      const cachedUsers = userCacheUtils.loadFromCache(companyInfo.id);
      if (cachedUsers) {
        setUsers(cachedUsers);
        return;
      }
    }

    try {
      setLoading(true);
      setError(null);
      
      const processedUsers = await userDataService.fetchUsers(companyInfo.id);
      setUsers(processedUsers);
      userCacheUtils.saveToCache(companyInfo.id, processedUsers);
      
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
  }, [companyInfo?.id, toast]);

  const refreshUsers = useCallback(async (): Promise<void> => {
    await loadUsers(false); // Force reload without cache
  }, [loadUsers]);

  const invalidateCache = useCallback(() => {
    if (companyInfo?.id) {
      userCacheUtils.invalidateCache(companyInfo.id);
    }
  }, [companyInfo?.id]);

  // User actions
  const updateUserStatus = useCallback(async (userId: string, isActive: boolean): Promise<boolean> => {
    try {
      await userActionsService.updateUserStatus(userId, isActive);
      
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
      await userActionsService.updateUserRole(userId, role, companyInfo?.id || '');

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
      await userActionsService.updateUserProfile(userId, profileId);

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
      await userActionsService.deleteUser(userId);

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

  // Initialize when company changes
  useEffect(() => {
    if (companyInfo?.id) {
      console.log('[UnifiedUserManagement] Company ID available, loading users');
      loadUsers(true);
    } else {
      console.log('[UnifiedUserManagement] No company ID, waiting...');
      setUsers([]);
    }
  }, [companyInfo?.id, loadUsers]);

  // Memoize return to avoid unnecessary re-renders
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
