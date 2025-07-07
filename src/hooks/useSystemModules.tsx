import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface SystemModule {
  id: string;
  name: string;
  route_path: string;
  description?: string;
  category: string;
  icon?: string;
  is_active: boolean;
  sort_order: number;
}

export const useSystemModules = () => {
  const [modules, setModules] = useState<SystemModule[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchModules = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('system_modules')
        .select('*')
        .eq('is_active', true)
        .order('sort_order');

      if (fetchError) throw fetchError;

      setModules(data || []);
    } catch (err: any) {
      console.error('Erro ao buscar módulos:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchModules();
  }, []);

  return {
    modules,
    loading,
    error,
    refetch: fetchModules
  };
};