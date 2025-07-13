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
  const { user, isAdmin, isMaster } = useAuth();
  const [allowedTabs, setAllowedTabs] = useState<SubModule[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTabPermissions = async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);

      // Admin e Master têm acesso a todas as abas
      if (isAdmin || isMaster) {
        const { data: allTabs } = await supabase
          .from('system_sub_modules')
          .select('*')
          .eq('is_active', true)
          .in('parent_module_id', await getModuleIds(moduleRoute))
          .order('sort_order');
        
        setAllowedTabs(allTabs || []);
        setLoading(false);
        return;
      }

      // Para usuários normais, buscar permissões específicas
      const moduleIds = await getModuleIds(moduleRoute);
      
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
        console.error('Erro ao buscar permissões de abas:', error);
        setAllowedTabs([]);
      } else {
        // Filtrar apenas abas do módulo atual
        const userAllowedTabs = userTabs?.map((t: any) => t.system_sub_modules).filter(Boolean) || [];
        const allowedModuleTabs = userAllowedTabs.filter(tab => moduleIds.includes(tab.parent_module_id)) || [];
        
        allowedModuleTabs.sort((a, b) => a.sort_order - b.sort_order);
        setAllowedTabs(allowedModuleTabs);
      }
    } catch (error) {
      console.error('Erro ao verificar acesso às abas:', error);
      setAllowedTabs([]);
    } finally {
      setLoading(false);
    }
  };

  const getModuleIds = async (route: string): Promise<string[]> => {
    const { data } = await supabase
      .from('system_modules')
      .select('id')
      .eq('route_path', route);
    
    return data?.map(m => m.id) || [];
  };

  const hasAccess = (tabKey: string): boolean => {
    if (isAdmin || isMaster) return true;
    return allowedTabs.some(tab => tab.tab_key === tabKey);
  };

  const getFirstAllowedTab = (): string | null => {
    return allowedTabs.length > 0 ? allowedTabs[0].tab_key : null;
  };

  useEffect(() => {
    fetchTabPermissions();
  }, [user, moduleRoute, isAdmin, isMaster]);
  
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