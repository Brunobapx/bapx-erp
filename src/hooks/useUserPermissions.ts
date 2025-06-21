
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/Auth/AuthProvider';

interface ModulePermission {
  moduleId: string;
  routePath: string;
  canView: boolean;
  canEdit: boolean;
  canDelete: boolean;
}

export const useUserPermissions = () => {
  const [permissions, setPermissions] = useState<ModulePermission[]>([]);
  const [loading, setLoading] = useState(true);
  const { user, userRole } = useAuth();

  const loadUserPermissions = async () => {
    if (!user) {
      console.log('[useUserPermissions] No user, clearing permissions');
      setPermissions([]);
      setLoading(false);
      return;
    }

    console.log('[useUserPermissions] Loading permissions for user:', user.email, 'role:', userRole);

    // Master e Admin têm acesso total
    if (userRole === 'master' || userRole === 'admin') {
      console.log('[useUserPermissions] User is admin/master, granting full access');
      const basicModules: ModulePermission[] = [
        { moduleId: 'dashboard', routePath: '/', canView: true, canEdit: true, canDelete: true },
        { moduleId: 'orders', routePath: '/pedidos', canView: true, canEdit: true, canDelete: true },
        { moduleId: 'products', routePath: '/produtos', canView: true, canEdit: true, canDelete: true },
        { moduleId: 'clients', routePath: '/clientes', canView: true, canEdit: true, canDelete: true },
        { moduleId: 'production', routePath: '/producao', canView: true, canEdit: true, canDelete: true },
        { moduleId: 'packaging', routePath: '/embalagem', canView: true, canEdit: true, canDelete: true },
        { moduleId: 'sales', routePath: '/vendas', canView: true, canEdit: true, canDelete: true },
        { moduleId: 'finance', routePath: '/financeiro', canView: true, canEdit: true, canDelete: true },
        { moduleId: 'routes', routePath: '/rotas', canView: true, canEdit: true, canDelete: true },
        { moduleId: 'calendar', routePath: '/calendario', canView: true, canEdit: true, canDelete: true },
        { moduleId: 'settings', routePath: '/configuracoes', canView: true, canEdit: true, canDelete: true },
        { moduleId: 'vendors', routePath: '/fornecedores', canView: true, canEdit: true, canDelete: true },
        { moduleId: 'purchases', routePath: '/compras', canView: true, canEdit: true, canDelete: true },
        { moduleId: 'stock', routePath: '/estoque', canView: true, canEdit: true, canDelete: true },
        { moduleId: 'fiscal', routePath: '/emissao-fiscal', canView: true, canEdit: true, canDelete: true },
        { moduleId: 'service-orders', routePath: '/ordens-servico', canView: true, canEdit: true, canDelete: true }
      ];
      
      setPermissions(basicModules);
      setLoading(false);
      return;
    }

    // Para usuários comuns, buscar permissões do perfil
    try {
      console.log('[useUserPermissions] Loading profile for user:', user.id);
      
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('profile_id')
        .eq('id', user.id)
        .single();

      if (profileError) {
        console.error('[useUserPermissions] Error loading profile:', profileError);
        throw profileError;
      }

      console.log('[useUserPermissions] User profile data:', profile);

      if (!profile?.profile_id) {
        console.log('[useUserPermissions] No profile_id found, giving basic access');
        // Se não tem perfil, dar acesso básico
        setPermissions([
          { moduleId: 'dashboard', routePath: '/', canView: true, canEdit: false, canDelete: false },
          { moduleId: 'settings', routePath: '/configuracoes', canView: true, canEdit: false, canDelete: false }
        ]);
        setLoading(false);
        return;
      }

      console.log('[useUserPermissions] Loading modules for profile:', profile.profile_id);

      // Buscar permissões do perfil
      const { data: profileModules, error: modulesError } = await supabase
        .from('profile_modules')
        .select(`
          can_view,
          can_edit,
          can_delete,
          system_modules!inner(
            id,
            route_path
          )
        `)
        .eq('profile_id', profile.profile_id);

      if (modulesError) {
        console.error('[useUserPermissions] Error loading profile modules:', modulesError);
        throw modulesError;
      }

      console.log('[useUserPermissions] Profile modules data:', profileModules);

      const modulePermissions: ModulePermission[] = [];

      if (profileModules) {
        profileModules.forEach((pm: any) => {
          if (pm.system_modules) {
            console.log('[useUserPermissions] Adding permission for module:', pm.system_modules.route_path, pm);
            modulePermissions.push({
              moduleId: pm.system_modules.id,
              routePath: pm.system_modules.route_path,
              canView: pm.can_view,
              canEdit: pm.can_edit,
              canDelete: pm.can_delete
            });
          }
        });
      }

      console.log('[useUserPermissions] Final permissions:', modulePermissions);
      setPermissions(modulePermissions);
    } catch (error) {
      console.error('[useUserPermissions] Error loading user permissions:', error);
      setPermissions([
        { moduleId: 'dashboard', routePath: '/', canView: true, canEdit: false, canDelete: false },
        { moduleId: 'settings', routePath: '/configuracoes', canView: true, canEdit: false, canDelete: false }
      ]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUserPermissions();
  }, [user, userRole]);

  const hasAccess = (routePath: string, permission: 'view' | 'edit' | 'delete' = 'view') => {
    console.log('[useUserPermissions] Checking access for:', routePath, 'permission:', permission);
    
    // Master e Admin têm acesso total
    if (userRole === 'master' || userRole === 'admin') {
      console.log('[useUserPermissions] Admin/Master access granted');
      return true;
    }

    const modulePermission = permissions.find(p => p.routePath === routePath);
    console.log('[useUserPermissions] Found permission:', modulePermission);
    
    if (!modulePermission) {
      console.log('[useUserPermissions] No permission found for route:', routePath);
      return false;
    }

    switch (permission) {
      case 'view':
        return modulePermission.canView;
      case 'edit':
        return modulePermission.canEdit;
      case 'delete':
        return modulePermission.canDelete;
      default:
        return false;
    }
  };

  const getAllowedRoutes = () => {
    const allowedRoutes = permissions
      .filter(p => p.canView)
      .map(p => p.routePath);
    
    console.log('[useUserPermissions] Allowed routes:', allowedRoutes);
    return allowedRoutes;
  };

  return {
    permissions,
    loading,
    hasAccess,
    getAllowedRoutes,
    loadUserPermissions
  };
};
