
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/components/Auth/AuthProvider';

export interface SimpleProfile {
  id: string;
  company_id: string;
  name: string;
  description: string;
  is_admin: boolean;
  is_active: boolean;
}

export const useSimpleProfiles = () => {
  const [profiles, setProfiles] = useState<SimpleProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const { companyInfo } = useAuth();

  const loadProfiles = async () => {
    try {
      if (!companyInfo?.id) {
        setProfiles([]);
        return;
      }

      const { data, error } = await supabase
        .from('access_profiles')
        .select('id, company_id, name, description, is_admin, is_active')
        .eq('company_id', companyInfo.id)
        .order('name');

      if (error) throw error;
      setProfiles(data || []);
    } catch (error: any) {
      toast({
        title: "Erro",
        description: "Erro ao carregar perfis",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const createProfile = async (profileData: Omit<SimpleProfile, 'id'>) => {
    try {
      const { error } = await supabase
        .from('access_profiles')
        .insert(profileData);

      if (error) throw error;
      
      toast({
        title: "Sucesso",
        description: "Perfil criado com sucesso!",
      });
      
      await loadProfiles();
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message || "Erro ao criar perfil",
        variant: "destructive",
      });
      throw error;
    }
  };

  useEffect(() => {
    if (companyInfo?.id) {
      loadProfiles();
    } else {
      setLoading(false);
    }
  }, [companyInfo?.id]);

  return {
    profiles,
    loading,
    loadProfiles,
    createProfile,
  };
};
