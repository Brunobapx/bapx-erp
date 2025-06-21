
import { useState, useEffect } from 'react';
import { useProfiles } from '@/hooks/useProfiles';
import { useToast } from "@/hooks/use-toast";
import { AccessProfile } from '@/types/profiles';

interface FormData {
  name: string;
  description: string;
  is_admin: boolean;
  is_active: boolean;
}

export const useEditProfileForm = (profileId: string, open: boolean) => {
  const { profiles, modules, updateProfile, loadProfileModules, updateProfileModules } = useProfiles();
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

  useEffect(() => {
    const loadData = async () => {
      if (profile && open) {
        console.log('Loading profile data:', profile);
        setFormData({
          name: profile.name || '',
          description: profile.description || '',
          is_admin: profile.is_admin || false,
          is_active: profile.is_active !== false,
        });

        // Carregar módulos do perfil
        try {
          const profileModules = await loadProfileModules(profileId);
          console.log('Profile modules loaded:', profileModules);
          setSelectedModules(profileModules.map(pm => pm.module_id));
        } catch (error) {
          console.error('Error loading profile modules:', error);
          setSelectedModules([]);
        }
      }
    };

    loadData();
  }, [profile, profileId, open, loadProfileModules]);

  const handleFormDataChange = (data: Partial<FormData>) => {
    setFormData(prev => ({ ...prev, ...data }));
  };

  const toggleModule = (moduleId: string) => {
    setSelectedModules(prev => {
      const newSelection = prev.includes(moduleId)
        ? prev.filter(id => id !== moduleId)
        : [...prev, moduleId];
      console.log('Module selection changed:', { moduleId, newSelection });
      return newSelection;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      console.log('Updating profile with data:', formData);
      await updateProfile(profileId, formData);
      
      // Atualizar módulos
      console.log('Updating profile modules:', selectedModules);
      await updateProfileModules(
        profileId,
        selectedModules.map(moduleId => ({
          moduleId,
          canView: true,
          canEdit: true,
          canDelete: false,
        }))
      );

      toast({
        title: "Sucesso",
        description: "Perfil atualizado com sucesso!",
      });

      return true;
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
  };

  return {
    profile,
    modules,
    formData,
    selectedModules,
    loading,
    handleFormDataChange,
    toggleModule,
    handleSubmit,
  };
};
