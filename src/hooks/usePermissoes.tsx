
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/Auth/AuthProvider';

export interface Perfil {
  id: string;
  nome: string;
  empresa_id: string;
  descricao?: string;
  is_admin: boolean;
}

export interface Permissao {
  module_id: string;
  pode_ver: boolean;
  pode_editar: boolean;
  pode_excluir: boolean;
}

export const usePermissoes = () => {
  const [perfil, setPerfil] = useState<Perfil | null>(null);
  const [permissoes, setPermissoes] = useState<Record<string, Permissao>>({});
  const [loading, setLoading] = useState(true);
  const { user, userRole } = useAuth();

  const loadUserProfile = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      console.log('[usePermissoes] Loading profile for user:', user.email);
      
      // Buscar perfil do usuário
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select(`
          perfil_id,
          perfis!inner(
            id,
            nome,
            empresa_id,
            descricao,
            is_admin
          )
        `)
        .eq('id', user.id)
        .single();

      if (profileError) {
        console.error('[usePermissoes] Error loading profile:', profileError);
      }

      if (profileData?.perfis) {
        const perfil = Array.isArray(profileData.perfis) ? profileData.perfis[0] : profileData.perfis;
        console.log('[usePermissoes] Loaded perfil:', perfil);
        
        setPerfil({
          id: perfil.id,
          nome: perfil.nome,
          empresa_id: perfil.empresa_id,
          descricao: perfil.descricao,
          is_admin: perfil.is_admin
        });

        // Buscar permissões do perfil
        const { data: permissoesData, error: permissoesError } = await supabase
          .from('permissoes')
          .select(`
            module_id,
            pode_ver,
            pode_editar,
            pode_excluir,
            saas_modules!inner(route_path)
          `)
          .eq('perfil_id', perfil.id);

        if (permissoesError) {
          console.error('[usePermissoes] Error loading permissions:', permissoesError);
        }

        // Organizar permissões por rota do módulo
        const permissoesMap: Record<string, Permissao> = {};
        permissoesData?.forEach((perm: any) => {
          const routePath = perm.saas_modules.route_path;
          permissoesMap[routePath] = {
            module_id: perm.module_id,
            pode_ver: perm.pode_ver,
            pode_editar: perm.pode_editar,
            pode_excluir: perm.pode_excluir,
          };
        });

        console.log('[usePermissoes] Loaded permissions map:', permissoesMap);
        setPermissoes(permissoesMap);
      }
    } catch (error) {
      console.error('[usePermissoes] Erro ao carregar perfil e permissões:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadUserProfile();
  }, [loadUserProfile]);

  const hasPermission = useCallback((routePath: string, tipo: 'pode_ver' | 'pode_editar' | 'pode_excluir' = 'pode_ver') => {
    // Master tem acesso total a tudo
    if (userRole === 'master') {
      console.log('[usePermissoes] Master user has full access to:', routePath);
      return true;
    }
    
    // Admin/Administrador tem acesso total
    if (perfil?.is_admin) {
      console.log('[usePermissoes] Admin user has full access to:', routePath);
      return true;
    }
    
    // Verificar permissão específica
    const permissao = permissoes[routePath];
    if (!permissao) {
      console.log('[usePermissoes] No permission found for:', routePath);
      return false;
    }
    
    const hasAccess = permissao[tipo];
    console.log('[usePermissoes] Permission check for', routePath, '(', tipo, '):', hasAccess);
    return hasAccess;
  }, [perfil, permissoes, userRole]);

  return {
    perfil,
    permissoes,
    loading,
    hasPermission,
    reloadPermissions: loadUserProfile,
  };
};
