import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/Auth/AuthProvider';

export interface UserPermissions {
  isAdmin: boolean;
  isMaster: boolean;
  userRole: string;
  userModules: string[];
  moduleIds: string[];
  hasModuleAccess: (routePath: string) => Promise<boolean>;
  loading: boolean;
}

export const useUserPermissions = (): UserPermissions => {
  const { user } = useAuth();
  const [userRole, setUserRole] = useState<string>('user');
  const [userModules, setUserModules] = useState<string[]>([]);
  const [moduleIds, setModuleIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  const isAdmin = userRole === 'admin';
  const isMaster = userRole === 'master';

  const fetchUserPermissions = async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);

      // Buscar role do usuário
      const { data: roleData, error: roleError } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .maybeSingle();

      if (roleError) {
        console.error('Erro ao buscar role:', roleError);
        setUserRole('user');
      } else {
        setUserRole(roleData?.role || 'user');
      }

      // Se for admin ou master, não precisa buscar permissões específicas
      if (roleData?.role === 'admin' || roleData?.role === 'master') {
        setUserModules([]);
        setModuleIds([]);
        setLoading(false);
        return;
      }

      // Buscar permissões de módulos para usuários normais
      const { data: permissions, error: permissionsError } = await supabase
        .from('user_module_permissions')
        .select(`
          system_modules (
            id,
            name,
            route_path
          )
        `)
        .eq('user_id', user.id);

      if (permissionsError) {
        console.error('Erro ao buscar permissões:', permissionsError);
        setUserModules([]);
        setModuleIds([]);
      } else {
        const modules = permissions?.map((p: any) => p.system_modules?.name).filter(Boolean) || [];
        const ids = permissions?.map((p: any) => p.system_modules?.id).filter(Boolean) || [];
        setUserModules(modules);
        setModuleIds(ids);
      }
    } catch (error) {
      console.error('Erro ao buscar permissões do usuário:', error);
      setUserRole('user');
      setUserModules([]);
      setModuleIds([]);
    } finally {
      setLoading(false);
    }
  };

  const hasModuleAccess = async (routePath: string): Promise<boolean> => {
    // Admin e Master têm acesso a tudo
    if (userRole === 'admin' || userRole === 'master') {
      return true;
    }

    try {
      // Para usuários normais, verificar se tem acesso ao módulo específico
      const { data } = await supabase
        .from('system_modules')
        .select('id')
        .eq('route_path', routePath)
        .eq('is_active', true)
        .maybeSingle();

      if (!data) {
        return false;
      }

      // Verificar se o usuário tem permissão para este módulo
      return moduleIds.includes(data.id);
    } catch (error) {
      console.error('Erro ao verificar acesso ao módulo:', error);
      return false;
    }
  };

  useEffect(() => {
    fetchUserPermissions();
  }, [user]);

  return {
    isAdmin,
    isMaster,
    userRole,
    userModules,
    moduleIds,
    hasModuleAccess,
    loading
  };
};