
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/components/Auth/AuthProvider';

export interface AccessProfile {
  id: string;
  company_id: string;
  name: string;
  description: string;
  is_active: boolean;
  is_admin: boolean;
  created_at: string;
  updated_at: string;
}

export interface SystemModule {
  id: string;
  name: string;
  route_path: string;
  description: string;
  category: string;
  icon: string;
  is_active: boolean;
  sort_order: number;
}

export interface ProfileModule {
  id: string;
  profile_id: string;
  module_id: string;
  can_view: boolean;
  can_edit: boolean;
  can_delete: boolean;
  module?: SystemModule;
}

export const useProfiles = () => {
  const [profiles, setProfiles] = useState<AccessProfile[]>([]);
  const [modules, setModules] = useState<SystemModule[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const { companyInfo } = useAuth();

  const loadProfiles = async () => {
    try {
      console.log('Loading profiles for company:', companyInfo?.id);
      
      if (!companyInfo?.id) {
        console.warn('No company ID available');
        return;
      }

      const { data, error } = await supabase
        .from('access_profiles')
        .select('*')
        .eq('company_id', companyInfo.id)
        .order('name');

      if (error) throw error;
      
      console.log('Loaded profiles:', data);
      setProfiles(data || []);
    } catch (error: any) {
      console.error('Error loading profiles:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar perfis",
        variant: "destructive",
      });
    }
  };

  const loadModules = async () => {
    try {
      console.log('Loading system modules');
      
      const { data, error } = await supabase
        .from('system_modules')
        .select('*')
        .eq('is_active', true)
        .order('category, sort_order');

      if (error) throw error;
      
      console.log('Loaded modules:', data);
      setModules(data || []);
    } catch (error: any) {
      console.error('Error loading modules:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar módulos",
        variant: "destructive",
      });
    }
  };

  const loadProfileModules = async (profileId: string): Promise<ProfileModule[]> => {
    try {
      const { data, error } = await supabase
        .from('profile_modules')
        .select(`
          *,
          module:system_modules(*)
        `)
        .eq('profile_id', profileId);

      if (error) throw error;
      return data || [];
    } catch (error: any) {
      toast({
        title: "Erro",
        description: "Erro ao carregar módulos do perfil",
        variant: "destructive",
      });
      return [];
    }
  };

  const createProfile = async (profileData: Omit<AccessProfile, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      const { data, error } = await supabase
        .from('access_profiles')
        .insert(profileData)
        .select()
        .single();

      if (error) throw error;
      
      toast({
        title: "Sucesso",
        description: "Perfil criado com sucesso!",
      });
      
      await loadProfiles();
      return data;
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message || "Erro ao criar perfil",
        variant: "destructive",
      });
      throw error;
    }
  };

  const updateProfile = async (profileId: string, profileData: Partial<AccessProfile>) => {
    try {
      const { error } = await supabase
        .from('access_profiles')
        .update(profileData)
        .eq('id', profileId);

      if (error) throw error;
      
      toast({
        title: "Sucesso",
        description: "Perfil atualizado com sucesso!",
      });
      
      await loadProfiles();
    } catch (error: any) {
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
      const { error } = await supabase
        .from('access_profiles')
        .delete()
        .eq('id', profileId);

      if (error) throw error;
      
      toast({
        title: "Sucesso",
        description: "Perfil excluído com sucesso!",
      });
      
      await loadProfiles();
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message || "Erro ao excluir perfil",
        variant: "destructive",
      });
      throw error;
    }
  };

  const updateProfileModules = async (profileId: string, modulePermissions: { moduleId: string; canView: boolean; canEdit: boolean; canDelete: boolean }[]) => {
    try {
      // Primeiro, remove todas as permissões existentes do perfil
      await supabase
        .from('profile_modules')
        .delete()
        .eq('profile_id', profileId);

      // Depois, insere as novas permissões
      if (modulePermissions.length > 0) {
        const { error } = await supabase
          .from('profile_modules')
          .insert(
            modulePermissions.map(perm => ({
              profile_id: profileId,
              module_id: perm.moduleId,
              can_view: perm.canView,
              can_edit: perm.canEdit,
              can_delete: perm.canDelete
            }))
          );

        if (error) throw error;
      }
      
      toast({
        title: "Sucesso",
        description: "Permissões do perfil atualizadas com sucesso!",
      });
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message || "Erro ao atualizar permissões",
        variant: "destructive",
      });
      throw error;
    }
  };

  useEffect(() => {
    const loadData = async () => {
      if (!companyInfo?.id) {
        setLoading(false);
        return;
      }
      
      setLoading(true);
      await Promise.all([loadProfiles(), loadModules()]);
      setLoading(false);
    };

    loadData();
  }, [companyInfo?.id]);

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
