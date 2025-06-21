
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

    // Master e Admin têm acesso total - não precisam de consulta ao banco
    if (userRole === 'master' || userRole === 'admin') {
      // Definir módulos básicos que sempre existem
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

    // Para usuários comuns, tentar buscar permissões do perfil
    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('profile_id')
        .eq('id', user.id)
        .single();

      if (!profile?.profile_id) {
        // Se não tem perfil, dar acesso básico ao dashboard apenas
        setPermissions([
          { moduleId: 'dashboard', routePath: '/', canView: true, canEdit: false, canDelete: false }
        ]);
        setLoading(false);
        return;
      }

      // Buscar permissões do perfil
      const { data: profileModules } = await supabase
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

      const modulePermissions: ModulePermission[] = [];
      
      // Sempre incluir dashboard
      modulePermissions.push({
        moduleId: 'dashboard',
        routePath: '/',
        canView: true,
        canEdit: false,
        canDelete: false
      });

      if (profileModules) {
        profileModules.forEach((pm: any) => {
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

      setPermissions(modulePermissions);
    } catch (error) {
      console.error('Erro ao carregar permissões do usuário:', error);
      // Em caso de erro, dar acesso ao dashboard
      setPermissions([
        { moduleId: 'dashboard', routePath: '/', canView: true, canEdit: false, canDelete: false }
      ]);
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

    // Dashboard sempre acessível
    if (routePath === '/') {
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
