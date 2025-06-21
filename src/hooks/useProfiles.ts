
import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/components/Auth/AuthProvider';
import { AccessProfile, SystemModule, ProfileModule, ModulePermission } from '@/types/profiles';
import { profilesService } from '@/services/profilesService';
import { modulesService } from '@/services/modulesService';

export const useProfiles = () => {
  const [profiles, setProfiles] = useState<AccessProfile[]>([]);
  const [modules, setModules] = useState<SystemModule[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const { companyInfo } = useAuth();

  const loadProfiles = async () => {
    try {
      if (!companyInfo?.id) {
        console.warn('No company ID available for profiles');
        setProfiles([]);
        return;
      }

      const data = await profilesService.loadProfiles(companyInfo.id);
      setProfiles(data);
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
      const data = await modulesService.loadModules();
      setModules(data);
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
      return await modulesService.loadProfileModules(profileId);
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
      const data = await profilesService.createProfile(profileData);
      
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
      await profilesService.updateProfile(profileId, profileData);
      await loadProfiles(); // Recarregar lista após atualização
    } catch (error: any) {
      console.error('Error updating profile:', error);
      throw error;
    }
  };

  const deleteProfile = async (profileId: string) => {
    try {
      await profilesService.deleteProfile(profileId);

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
    modulePermissions: ModulePermission[]
  ) => {
    try {
      await modulesService.updateProfileModules(profileId, modulePermissions);
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

// Re-export types for convenience
export type { AccessProfile, SystemModule, ProfileModule, ModulePermission };
