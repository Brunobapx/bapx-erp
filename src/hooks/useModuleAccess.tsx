
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/Auth/AuthProvider';

export const useModuleAccess = () => {
  const [allowedRoutes, setAllowedRoutes] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  const checkModuleAccess = useCallback(async (route: string): Promise<boolean> => {
    if (!user) return false;

    try {
      // Usar a função SQL para verificar acesso
      const { data, error } = await supabase
        .rpc('user_has_permission', {
          _user_id: user.id,
          _module_route: route,
          _permission_type: 'pode_ver'
        });

      if (error) {
        console.error('Erro ao verificar acesso:', error);
        return false;
      }

      return data === true;
    } catch (error) {
      console.error('Erro ao verificar acesso ao módulo:', error);
      return false;
    }
  }, [user]);

  const loadAllowedRoutes = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      // Buscar todos os módulos
      const { data: modules, error: modulesError } = await supabase
        .from('saas_modules')
        .select('route_path');

      if (modulesError) throw modulesError;

      const allowed: string[] = [];
      
      // Verificar acesso para cada módulo
      for (const module of modules || []) {
        if (module.route_path) {
          const hasAccess = await checkModuleAccess(module.route_path);
          if (hasAccess) {
            allowed.push(module.route_path);
          }
        }
      }

      setAllowedRoutes(allowed);
    } catch (error) {
      console.error('Erro ao carregar rotas permitidas:', error);
    } finally {
      setLoading(false);
    }
  }, [user, checkModuleAccess]);

  useEffect(() => {
    loadAllowedRoutes();
  }, [loadAllowedRoutes]);

  return {
    allowedRoutes,
    loading,
    checkModuleAccess,
    loadAllowedRoutes,
  };
};
