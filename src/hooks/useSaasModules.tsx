
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface SaasModule {
  id: string;
  name: string;
  description: string;
  category: string;
  icon: string;
  route_path: string;
  is_core: boolean;
  created_at: string;
  updated_at: string;
}

export const useSaasModules = () => {
  const [modules, setModules] = useState<SaasModule[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const loadModules = async () => {
    try {
      const { data, error } = await supabase
        .from('saas_modules')
        .select('*')
        .order('category', { ascending: true });

      if (error) throw error;
      setModules(data || []);
    } catch (error: any) {
      toast({
        title: "Erro",
        description: "Erro ao carregar módulos",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadModules();
  }, []);

  return {
    modules,
    loading,
    loadModules,
  };
};
