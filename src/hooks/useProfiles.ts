
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
        console.warn('No company ID available for profiles');
        setProfiles([]);
        return;
      }

      const { data, error } = await supabase
        .from('access_profiles')
        .select('*')
        .eq('company_id', companyInfo.id)
        .order('name');

      if (error) {
        console.error('Error loading profiles:', error);
        throw error;
      }
      
      console.log('Loaded profiles:', data);
      setProfiles(data || []);
    } catch (error: any) {
      console.error('Error loading profiles:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar perfis",
        variant: "destructive",
      });
      setProfiles([]);
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

      if (error) {
        console.error('Error loading modules:', error);
        throw error;
      }
      
      console.log('Loaded modules:', data);
      setModules(data || []);
    } catch (error: any) {
      console.error('Error loading modules:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar módulos",
        variant: "destructive",
      });
      setModules([]);
    }
  };

  const loadProfileModules = async (profileId: string): Promise<ProfileModule[]> => {
    try {
      console.log('Loading modules for profile:', profileId);
      
      const { data, error } = await supabase
        .from('profile_modules')
        .select(`
          *,
          system_modules(*)
        `)
        .eq('profile_id', profileId);

      if (error) {
        console.error('Error loading profile modules:', error);
        throw error;
      }

      console.log('Profile modules loaded:', data?.length || 0);
      return data || [];
    } catch (error: any) {
      console.error('Error loading profile modules:', error);
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
      console.log('Creating profile:', profileData);
      
      const { data, error } = await supabase
        .from('access_profiles')
        .insert(profileData)
        .select()
        .single();

      if (error) {
        console.error('Error creating profile:', error);
        throw error;
      }
      
      toast({
        title: "Sucesso",
        description: "Perfil criado com sucesso!",
      });
      
      await loadProfiles(); // Recarregar lista
      return data;
    } catch (error: any) {
      console.error('Error creating profile:', error);
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
      console.log('Updating profile:', profileId, profileData);
      
      const updateData = {
        name: profileData.name,
        description: profileData.description,
        is_admin: profileData.is_admin,
        is_active: profileData.is_active,
        updated_at: new Date().toISOString()
      };

      const { error } = await supabase
        .from('access_profiles')
        .update(updateData)
        .eq('id', profileId);

      if (error) {
        console.error('Error updating profile:', error);
        throw error;
      }
      
      console.log('Profile updated successfully');
      await loadProfiles(); // Recarregar lista após atualização
    } catch (error: any) {
      console.error('Error updating profile:', error);
      throw error;
    }
  };

  const deleteProfile = async (profileId: string) => {
    try {
      console.log('Deleting profile:', profileId);
      
      // Primeiro remover módulos do perfil
      const { error: modulesError } = await supabase
        .from('profile_modules')
        .delete()
        .eq('profile_id', profileId);

      if (modulesError) {
        console.error('Error deleting profile modules:', modulesError);
        throw modulesError;
      }

      // Depois remover o perfil
      const { error } = await supabase
        .from('access_profiles')
        .delete()
        .eq('id', profileId);

      if (error) {
        console.error('Error deleting profile:', error);
        throw error;
      }

      toast({
        title: "Sucesso",
        description: "Perfil excluído com sucesso!",
      });
      
      await loadProfiles(); // Recarregar lista
    } catch (error: any) {
      console.error('Error deleting profile:', error);
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
    modulePermissions: { moduleId: string; canView: boolean; canEdit: boolean; canDelete: boolean }[]
  ) => {
    try {
      console.log('Updating profile modules:', profileId, modulePermissions);
      
      // Primeiro, remove todas as permissões existentes do perfil
      const { error: deleteError } = await supabase
        .from('profile_modules')
        .delete()
        .eq('profile_id', profileId);

      if (deleteError) {
        console.error('Error deleting existing profile modules:', deleteError);
        throw deleteError;
      }

      // Depois, insere as novas permissões
      if (modulePermissions.length > 0) {
        const insertData = modulePermissions.map(perm => ({
          profile_id: profileId,
          module_id: perm.moduleId,
          can_view: perm.canView,
          can_edit: perm.canEdit,
          can_delete: perm.canDelete
        }));

        console.log('Inserting new profile modules:', insertData);

        const { error } = await supabase
          .from('profile_modules')
          .insert(insertData);

        if (error) {
          console.error('Error inserting profile modules:', error);
          throw error;
        }
      }
      
      console.log('Profile modules updated successfully');
    } catch (error: any) {
      console.error('Error updating profile modules:', error);
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
