
import { useState, useEffect, useCallback } from 'react';
import { useProfiles } from '@/hooks/useProfiles';
import { useProfileModules } from '@/hooks/useProfileModules';
import { useToast } from "@/hooks/use-toast";

interface FormData {
  name: string;
  description: string;
  is_admin: boolean;
  is_active: boolean;
}

export const useEditProfileForm = (profileId: string, open: boolean) => {
  const { profiles, modules, updateProfile } = useProfiles();
  const { profileModules, loading: modulesLoading, loadProfileModules, updateProfileModules } = useProfileModules();
  const { toast } = useToast();
  
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    name: '',
    description: '',
    is_admin: false,
    is_active: true,
  });
  const [selectedModules, setSelectedModules] = useState<string[]>([]);

  const profile = profiles.find(p => p.id === profileId);

  const loadData = useCallback(async () => {
    if (!profile || !open || !profileId) {
      return;
    }

    console.log('Loading profile data:', profile);
    
    // Carregar dados do formulário
    setFormData({
      name: profile.name || '',
      description: profile.description || '',
      is_admin: profile.is_admin || false,
      is_active: profile.is_active !== false,
    });

    // Carregar módulos do perfil
    try {
      const modules = await loadProfileModules(profileId);
      const moduleIds = modules.map(pm => pm.module_id);
      setSelectedModules(moduleIds);
      console.log('Profile modules loaded:', moduleIds.length);
    } catch (error) {
      console.error('Error loading profile modules in form:', error);
      setSelectedModules([]);
    }
  }, [profile, profileId, open, loadProfileModules]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleFormDataChange = useCallback((data: Partial<FormData>) => {
    setFormData(prev => ({ ...prev, ...data }));
  }, []);

  const toggleModule = useCallback((moduleId: string) => {
    setSelectedModules(prev => {
      const newSelection = prev.includes(moduleId)
        ? prev.filter(id => id !== moduleId)
        : [...prev, moduleId];
      console.log('Module selection changed:', { moduleId, newSelection: newSelection.length });
      return newSelection;
    });
  }, []);

  const handleSubmit = useCallback(async (e: React.FormEvent): Promise<boolean> => {
    e.preventDefault();
    
    if (!profileId) {
      toast({
        title: "Erro",
        description: "ID do perfil não encontrado",
        variant: "destructive",
      });
      return false;
    }

    setLoading(true);
    
    try {
      console.log('Updating profile with data:', formData);
      
      // Atualizar dados do perfil
      await updateProfile(profileId, formData);
      
      // Atualizar módulos do perfil
      console.log('Updating profile modules:', selectedModules.length);
      const modulePermissions = selectedModules.map(moduleId => ({
        moduleId,
        canView: true,
        canEdit: true,
        canDelete: false,
      }));
      
      const success = await updateProfileModules(profileId, modulePermissions);
      
      if (success) {
        toast({
          title: "Sucesso",
          description: "Perfil atualizado com sucesso!",
        });
        return true;
      }
      
      return false;
    } catch (error: any) {
      console.error('Error updating profile:', error);
      toast({
        title: "Erro",
        description: error.message || "Erro ao atualizar perfil",
        variant: "destructive",
      });
      return false;
    } finally {
      setLoading(false);
    }
  }, [profileId, formData, selectedModules, updateProfile, updateProfileModules, toast]);

  return {
    profile,
    modules,
    formData,
    selectedModules,
    loading: loading || modulesLoading,
    handleFormDataChange,
    toggleModule,
    handleSubmit,
  };
};
