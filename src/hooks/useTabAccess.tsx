import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/Auth/AuthProvider';

interface SubModule {
  id: string;
  name: string;
  tab_key: string;
  description: string | null;
  icon: string | null;
  sort_order: number;
}

interface TabAccessHook {
  allowedTabs: SubModule[];
  loading: boolean;
  hasAccess: (tabKey: string) => boolean;
  getFirstAllowedTab: () => string | null;
  refetchPermissions: () => void;
}

export const useTabAccess = (moduleRoute: string): TabAccessHook => {
  const { user } = useAuth();
  const [allowedTabs, setAllowedTabs] = useState<SubModule[]>([]);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState<string>('user');

  const fetchTabPermissions = async () => {
    if (!user) {
      console.log('[useTabAccess] No user, setting loading to false');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      console.log('[useTabAccess] Fetching tab permissions for user:', user.email, 'module:', moduleRoute);

      // Buscar role do usuário primeiro
      const { data: roleData, error: roleError } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .maybeSingle();

      if (roleError) {
        console.error('[useTabAccess] Error fetching user role:', roleError);
      }

      const currentRole = roleData?.role || 'user';
      setUserRole(currentRole);
      console.log('[useTabAccess] User role:', currentRole);

      // Admin e Master têm acesso a todas as abas
      if (currentRole === 'admin' || currentRole === 'master') {
        console.log('[useTabAccess] User is admin/master, fetching all tabs');
        const moduleIds = await getModuleIds(moduleRoute);
        console.log('[useTabAccess] Module IDs:', moduleIds);
        
        const { data: allTabs, error: tabsError } = await supabase
          .from('system_sub_modules')
          .select('*')
          .eq('is_active', true)
          .in('parent_module_id', moduleIds)
          .order('sort_order');
        
        if (tabsError) {
          console.error('[useTabAccess] Error fetching tabs:', tabsError);
        }
        
        console.log('[useTabAccess] All tabs for admin/master:', allTabs);
        setAllowedTabs(allTabs || []);
        setLoading(false);
        return;
      }

      // Para usuários normais, buscar permissões específicas
      console.log('[useTabAccess] User is normal user, fetching specific permissions');
      const moduleIds = await getModuleIds(moduleRoute);
      console.log('[useTabAccess] Module IDs for normal user:', moduleIds);
      
      const { data: userTabs, error } = await supabase
        .from('user_tab_permissions')
        .select(`
          sub_module_id,
          system_sub_modules!inner (
            id,
            name,
            tab_key,
            description,
            icon,
            sort_order,
            parent_module_id
          )
        `)
        .eq('user_id', user.id);

      if (error) {
        console.error('[useTabAccess] Erro ao buscar permissões de abas:', error);
        setAllowedTabs([]);
      } else {
        console.log('[useTabAccess] User tabs raw data:', userTabs);
        // Filtrar apenas abas do módulo atual
        const userAllowedTabs = userTabs?.map((t: any) => t.system_sub_modules).filter(Boolean) || [];
        const allowedModuleTabs = userAllowedTabs.filter(tab => moduleIds.includes(tab.parent_module_id)) || [];
        
        allowedModuleTabs.sort((a, b) => a.sort_order - b.sort_order);
        console.log('[useTabAccess] Final allowed tabs for normal user:', allowedModuleTabs);
        setAllowedTabs(allowedModuleTabs);
      }
    } catch (error) {
      console.error('[useTabAccess] Erro ao verificar acesso às abas:', error);
      setAllowedTabs([]);
    } finally {
      setLoading(false);
    }
  };

  const getModuleIds = async (route: string): Promise<string[]> => {
    console.log('[useTabAccess] Getting module IDs for route:', route);
    const { data, error } = await supabase
      .from('system_modules')
      .select('id')
      .eq('route_path', route);
    
    if (error) {
      console.error('[useTabAccess] Error fetching module IDs:', error);
    }
    
    const moduleIds = data?.map(m => m.id) || [];
    console.log('[useTabAccess] Found module IDs:', moduleIds);
    return moduleIds;
  };

  const hasAccess = (tabKey: string): boolean => {
    if (userRole === 'admin' || userRole === 'master') return true;
    return allowedTabs.some(tab => tab.tab_key === tabKey);
  };

  const getFirstAllowedTab = (): string | null => {
    return allowedTabs.length > 0 ? allowedTabs[0].tab_key : null;
  };

  useEffect(() => {
    fetchTabPermissions();
  }, [user, moduleRoute]);
  
  // Método para forçar recarregamento das permissões
  const refetchPermissions = () => {
    fetchTabPermissions();
  };

  return {
    allowedTabs,
    loading,
    hasAccess,
    getFirstAllowedTab,
    refetchPermissions
  };
};