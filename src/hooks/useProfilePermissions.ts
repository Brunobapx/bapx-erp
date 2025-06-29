
import { useState, useEffect } from 'react';
import { useAuth } from '@/components/Auth/AuthProvider';
import { supabase } from '@/integrations/supabase/client';

interface ModulePermission {
  module_id: string;
  route_path: string;
  can_view: boolean;
  can_edit: boolean;
  can_delete: boolean;
}

export const useProfilePermissions = () => {
  const { user, userRole } = useAuth();
  const [permissions, setPermissions] = useState<ModulePermission[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setPermissions([]);
      setLoading(false);
      return;
    }

    // Master e Admin têm acesso total - não precisam buscar permissões do perfil
    if (userRole === 'master' || userRole === 'admin') {
      setLoading(false);
      return;
    }

    fetchUserPermissions();
  }, [user, userRole]);

  const fetchUserPermissions = async () => {
    try {
      console.log('[useProfilePermissions] Fetching permissions for user:', user?.id);
      
      const { data, error } = await supabase
        .from('profiles')
        .select(`
          profile_id,
          access_profiles!inner(
            id,
            name,
            is_active,
            profile_modules(
              can_view,
              can_edit,
              can_delete,
              system_modules!inner(
                id,
                route_path,
                is_active
              )
            )
          )
        `)
        .eq('id', user?.id)
        .single();

      if (error) {
        console.error('[useProfilePermissions] Error fetching permissions:', error);
        setPermissions([]);
        return;
      }

      if (!data?.access_profiles?.profile_modules) {
        console.log('[useProfilePermissions] No profile or modules found for user');
        setPermissions([]);
        return;
      }

      const modulePermissions: ModulePermission[] = data.access_profiles.profile_modules
        .filter((pm: any) => pm.system_modules?.is_active && pm.can_view)
        .map((pm: any) => ({
          module_id: pm.system_modules.id,
          route_path: pm.system_modules.route_path,
          can_view: pm.can_view,
          can_edit: pm.can_edit,
          can_delete: pm.can_delete,
        }));

      console.log('[useProfilePermissions] User permissions loaded:', modulePermissions);
      setPermissions(modulePermissions);
    } catch (error) {
      console.error('[useProfilePermissions] Unexpected error:', error);
      setPermissions([]);
    } finally {
      setLoading(false);
    }
  };

  const hasAccess = (routePath: string): boolean => {
    // Master e Admin têm acesso total
    if (userRole === 'master' || userRole === 'admin') {
      return true;
    }

    // Dashboard sempre acessível
    if (routePath === '/' || routePath === '/configuracoes') {
      return true;
    }

    // Verificar se o usuário tem permissão via perfil
    return permissions.some(permission => permission.route_path === routePath && permission.can_view);
  };

  const getAllowedRoutes = (): string[] => {
    // Master e Admin têm acesso total
    if (userRole === 'master' || userRole === 'admin') {
      return [
        '/', '/pedidos', '/produtos', '/clientes', '/producao', 
        '/embalagem', '/vendas', '/financeiro', '/rotas', '/calendario',
        '/configuracoes', '/fornecedores', '/compras', '/estoque',
        '/emissao-fiscal', '/ordens-servico'
      ];
    }

    // Rotas básicas sempre permitidas
    const baseRoutes = ['/', '/configuracoes'];
    
    // Adicionar rotas permitidas pelo perfil
    const profileRoutes = permissions.map(permission => permission.route_path);
    
    return [...baseRoutes, ...profileRoutes];
  };

  return {
    permissions,
    loading,
    hasAccess,
    getAllowedRoutes,
    userRole,
  };
};
