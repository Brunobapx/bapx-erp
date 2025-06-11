
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

export interface PlanModule {
  id: string;
  plan_id: string;
  module_id: string;
  created_at: string;
  saas_modules?: SaasModule;
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

  const getPlanModules = async (planId: string): Promise<string[]> => {
    try {
      const { data, error } = await supabase
        .from('saas_plan_modules')
        .select('module_id')
        .eq('plan_id', planId);

      if (error) throw error;
      return data?.map(item => item.module_id) || [];
    } catch (error: any) {
      console.error('Erro ao carregar módulos do plano:', error);
      return [];
    }
  };

  const updatePlanModules = async (planId: string, moduleIds: string[]) => {
    try {
      // Primeiro, remover todos os módulos do plano
      await supabase
        .from('saas_plan_modules')
        .delete()
        .eq('plan_id', planId);

      // Depois, inserir os novos módulos
      if (moduleIds.length > 0) {
        const planModules = moduleIds.map(moduleId => ({
          plan_id: planId,
          module_id: moduleId,
        }));

        const { error } = await supabase
          .from('saas_plan_modules')
          .insert(planModules);

        if (error) throw error;
      }

      toast({
        title: "Sucesso",
        description: "Módulos do plano atualizados com sucesso!",
      });
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message || "Erro ao atualizar módulos do plano",
        variant: "destructive",
      });
      throw error;
    }
  };

  useEffect(() => {
    loadModules();
  }, []);

  return {
    modules,
    loading,
    loadModules,
    getPlanModules,
    updatePlanModules,
  };
};
