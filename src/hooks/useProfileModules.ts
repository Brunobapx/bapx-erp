
import { useState, useCallback } from 'react';
import { useToast } from "@/hooks/use-toast";
import { ProfileModule, ModulePermission } from '@/types/profiles';
import { modulesService } from '@/services/modulesService';

export const useProfileModules = () => {
  const [loading, setLoading] = useState(false);
  const [profileModules, setProfileModules] = useState<ProfileModule[]>([]);
  const { toast } = useToast();

  const loadProfileModules = useCallback(async (profileId: string): Promise<ProfileModule[]> => {
    if (!profileId) {
      console.warn('No profile ID provided to loadProfileModules');
      return [];
    }

    setLoading(true);
    try {
      const modules = await modulesService.loadProfileModules(profileId);
      setProfileModules(modules);
      return modules;
    } catch (error: any) {
      console.error('Error loading profile modules:', error);
      
      // Mostrar toast apenas se não for um erro de perfil não encontrado
      if (!error.message?.includes('não encontrado')) {
        toast({
          title: "Erro",
          description: error.message || "Erro ao carregar módulos do perfil",
          variant: "destructive",
        });
      }
      
      setProfileModules([]);
      return [];
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const updateProfileModules = useCallback(async (
    profileId: string, 
    modulePermissions: ModulePermission[]
  ): Promise<boolean> => {
    if (!profileId) {
      toast({
        title: "Erro",
        description: "ID do perfil é obrigatório",
        variant: "destructive",
      });
      return false;
    }

    setLoading(true);
    try {
      await modulesService.updateProfileModules(profileId, modulePermissions);
      
      // Recarregar os módulos após a atualização
      await loadProfileModules(profileId);
      
      return true;
    } catch (error: any) {
      console.error('Error updating profile modules:', error);
      toast({
        title: "Erro",
        description: error.message || "Erro ao atualizar módulos do perfil",
        variant: "destructive",
      });
      return false;
    } finally {
      setLoading(false);
    }
  }, [toast, loadProfileModules]);

  const clearProfileModules = useCallback(() => {
    setProfileModules([]);
  }, []);

  return {
    profileModules,
    loading,
    loadProfileModules,
    updateProfileModules,
    clearProfileModules,
  };
};
