
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
      setPermissions([]);
      setLoading(false);
      return;
    }

    // Master e Admin têm acesso total
    if (userRole === 'master' || userRole === 'admin') {
      try {
        const { data: modules, error } = await supabase
          .from('system_modules')
          .select('id, route_path')
          .eq('is_active', true);

        if (error) throw error;

        const fullPermissions: ModulePermission[] = modules.map(module => ({
          moduleId: module.id,
          routePath: module.route_path,
          canView: true,
          canEdit: true,
          canDelete: true
        }));

        setPermissions(fullPermissions);
      } catch (error) {
        console.error('Erro ao carregar módulos para admin:', error);
        setPermissions([]);
      }
      setLoading(false);
      return;
    }

    // Para usuários comuns, buscar permissões baseadas no perfil
    try {
      const { data: userPermissions, error } = await supabase
        .from('profiles')
        .select(`
          access_profiles!inner(
            profile_modules!inner(
              can_view,
              can_edit,
              can_delete,
              system_modules!inner(
                id,
                route_path
              )
            )
          )
        `)
        .eq('id', user.id)
        .single();

      if (error) throw error;

      const modulePermissions: ModulePermission[] = [];
      
      if (userPermissions?.access_profiles) {
        // Tratar access_profiles como any para contornar problemas de tipagem do Supabase
        const accessProfiles = userPermissions.access_profiles as any;
        
        if (accessProfiles && accessProfiles.profile_modules) {
          accessProfiles.profile_modules.forEach((pm: any) => {
            if (pm.system_modules) {
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
      }

      setPermissions(modulePermissions);
    } catch (error) {
      console.error('Erro ao carregar permissões do usuário:', error);
      setPermissions([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUserPermissions();
  }, [user, userRole]);

  const hasAccess = (routePath: string, permission: 'view' | 'edit' | 'delete' = 'view') => {
    // Master e Admin têm acesso total
    if (userRole === 'master' || userRole === 'admin') {
      return true;
    }

    const modulePermission = permissions.find(p => p.routePath === routePath);
    if (!modulePermission) return false;

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
    return permissions
      .filter(p => p.canView)
      .map(p => p.routePath);
  };

  return {
    permissions,
    loading,
    hasAccess,
    getAllowedRoutes,
    loadUserPermissions
  };
};
