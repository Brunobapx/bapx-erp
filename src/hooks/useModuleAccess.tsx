import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/Auth/AuthProvider';

interface ModuleAccessHook {
  hasAccess: (routePath: string) => boolean;
  loading: boolean;
  allowedModuleRoutes: string[];
}

export const useModuleAccess = (): ModuleAccessHook => {
  const { user } = useAuth();
  const [allowedModuleRoutes, setAllowedModuleRoutes] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState<string>('user');

  const fetchUserModuleAccess = async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);

      // Buscar role do usuário primeiro
      const { data: roleData } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .maybeSingle();

      const currentRole = roleData?.role || 'user';
      setUserRole(currentRole);

      // Admin e Master têm acesso a todos os módulos
      if (currentRole === 'admin' || currentRole === 'master') {
        const { data: allModules } = await supabase
          .from('system_modules')
          .select('route_path')
          .eq('is_active', true);
        
        setAllowedModuleRoutes(allModules?.map(m => m.route_path) || []);
        setLoading(false);
        return;
      }

      // Para usuários normais, buscar apenas módulos permitidos
      const { data: permissions, error } = await supabase
        .from('user_module_permissions')
        .select(`
          system_modules (
            route_path
          )
        `)
        .eq('user_id', user.id);

      if (error) {
        console.error('Erro ao buscar permissões de módulos:', error);
        setAllowedModuleRoutes([]);
      } else {
        const routes = permissions?.map((p: any) => p.system_modules?.route_path).filter(Boolean) || [];
        setAllowedModuleRoutes(routes);
      }
    } catch (error) {
      console.error('Erro ao verificar acesso aos módulos:', error);
      setAllowedModuleRoutes([]);
    } finally {
      setLoading(false);
    }
  };

  const hasAccess = (routePath: string): boolean => {
    // Admin e Master têm acesso a tudo
    if (userRole === 'admin' || userRole === 'master') {
      return true;
    }

    // Verificar se o usuário tem acesso a este módulo específico
    return allowedModuleRoutes.includes(routePath);
  };

  useEffect(() => {
    fetchUserModuleAccess();
  }, [user]);

  return {
    hasAccess,
    loading,
    allowedModuleRoutes
  };
};