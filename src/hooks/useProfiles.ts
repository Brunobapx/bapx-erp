
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/components/Auth/AuthProvider';

interface Profile {
  id: string;
  name: string;
  description?: string;
  is_admin: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface Module {
  id: string;
  name: string;
  route_path: string;
  description?: string;
  category: string;
  icon?: string;
  is_active: boolean;
  sort_order: number;
}

interface ProfileModule {
  id: string;
  profile_id: string;
  module_id: string;
  can_view: boolean;
  can_edit: boolean;
  can_delete: boolean;
}

export const useProfiles = () => {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [modules, setModules] = useState<Module[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const { user, companyInfo } = useAuth();

  const loadProfiles = async () => {
    if (!user || !companyInfo?.id) return;
    
    try {
      console.log('[useProfiles] Carregando perfis da empresa:', companyInfo.id);
      
      const { data, error } = await supabase
        .from('access_profiles')
        .select('*')
        .eq('company_id', companyInfo.id)
        .order('name');

      if (error) throw error;

      console.log('[useProfiles] Perfis carregados:', data?.length);
      setProfiles(data || []);
    } catch (error: any) {
      console.error('[useProfiles] Erro ao carregar perfis:', error);
      toast({
        title: "Erro",
        description: error.message || "Erro ao carregar perfis",
        variant: "destructive",
      });
    }
  };

  const loadModules = async () => {
    try {
      console.log('[useProfiles] Carregando módulos do sistema');
      
      const { data, error } = await supabase
        .from('system_modules')
        .select('*')
        .eq('is_active', true)
        .order('sort_order');

      if (error) throw error;

      console.log('[useProfiles] Módulos carregados:', data?.length);
      setModules(data || []);
    } catch (error: any) {
      console.error('[useProfiles] Erro ao carregar módulos:', error);
      toast({
        title: "Erro",
        description: error.message || "Erro ao carregar módulos",
        variant: "destructive",
      });
    }
  };

  const loadProfileModules = async (profileId: string): Promise<ProfileModule[]> => {
    try {
      console.log('[useProfiles] Carregando módulos do perfil:', profileId);
      
      const { data, error } = await supabase
        .from('profile_modules')
        .select('*')
        .eq('profile_id', profileId);

      if (error) throw error;

      console.log('[useProfiles] Módulos do perfil carregados:', data?.length);
      return data || [];
    } catch (error: any) {
      console.error('[useProfiles] Erro ao carregar módulos do perfil:', error);
      return [];
    }
  };

  const createProfile = async (profileData: {
    name: string;
    description?: string;
    is_admin: boolean;
    company_id: string;
    is_active: boolean;
  }) => {
    try {
      const { data, error } = await supabase
        .from('access_profiles')
        .insert([profileData])
        .select()
        .single();

      if (error) throw error;

      await loadProfiles();
      toast({
        title: "Sucesso",
        description: "Perfil criado com sucesso!",
      });

      return data;
    } catch (error: any) {
      console.error('[useProfiles] Erro ao criar perfil:', error);
      toast({
        title: "Erro",
        description: error.message || "Erro ao criar perfil",
        variant: "destructive",
      });
      throw error;
    }
  };

  const updateProfile = async (profileId: string, profileData: Partial<Profile>) => {
    try {
      const { error } = await supabase
        .from('access_profiles')
        .update(profileData)
        .eq('id', profileId);

      if (error) throw error;

      await loadProfiles();
      toast({
        title: "Sucesso",
        description: "Perfil atualizado com sucesso!",
      });
    } catch (error: any) {
      console.error('[useProfiles] Erro ao atualizar perfil:', error);
      toast({
        title: "Erro",
        description: error.message || "Erro ao atualizar perfil",
        variant: "destructive",
      });
      throw error;
    }
  };

  const deleteProfile = async (profileId: string) => {
    try {
      // Primeiro remover módulos do perfil
      await supabase
        .from('profile_modules')
        .delete()
        .eq('profile_id', profileId);

      // Depois remover o perfil
      const { error } = await supabase
        .from('access_profiles')
        .delete()
        .eq('id', profileId);

      if (error) throw error;

      await loadProfiles();
      toast({
        title: "Sucesso",
        description: "Perfil excluído com sucesso!",
      });
    } catch (error: any) {
      console.error('[useProfiles] Erro ao excluir perfil:', error);
      toast({
        title: "Erro",
        description: error.message || "Erro ao excluir perfil",
        variant: "destructive",
      });
      throw error;
    }
  };

  const updateProfileModules = async (
    profileId: string,
    modulePermissions: Array<{
      moduleId: string;
      canView: boolean;
      canEdit: boolean;
      canDelete: boolean;
    }>
  ) => {
    try {
      // Primeiro remover módulos existentes
      await supabase
        .from('profile_modules')
        .delete()
        .eq('profile_id', profileId);

      // Depois inserir novos módulos
      if (modulePermissions.length > 0) {
        const { error } = await supabase
          .from('profile_modules')
          .insert(
            modulePermissions.map(mp => ({
              profile_id: profileId,
              module_id: mp.moduleId,
              can_view: mp.canView,
              can_edit: mp.canEdit,
              can_delete: mp.canDelete,
            }))
          );

        if (error) throw error;
      }

      toast({
        title: "Sucesso",
        description: "Módulos do perfil atualizados com sucesso!",
      });
    } catch (error: any) {
      console.error('[useProfiles] Erro ao atualizar módulos do perfil:', error);
      toast({
        title: "Erro",
        description: error.message || "Erro ao atualizar módulos do perfil",
        variant: "destructive",
      });
      throw error;
    }
  };

  useEffect(() => {
    const initializeData = async () => {
      setLoading(true);
      await Promise.all([loadProfiles(), loadModules()]);
      setLoading(false);
    };

    if (user && companyInfo?.id) {
      initializeData();
    }
  }, [user, companyInfo?.id]);

  return {
    profiles,
    modules,
    loading,
    loadProfiles,
    loadModules,
    loadProfileModules,
    createProfile,
    updateProfile,
    deleteProfile,
    updateProfileModules,
  };
};
