
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface SaasPlan {
  id: string;
  name: string;
  description: string;
  price: number;
  billing_cycle: string;
  max_users: number | null;
  features: string[];
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export const useSaasPlans = () => {
  const [plans, setPlans] = useState<SaasPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const loadPlans = async () => {
    try {
      const { data, error } = await supabase
        .from('saas_plans')
        .select('*')
        .order('price', { ascending: true });

      if (error) throw error;
      setPlans(data || []);
    } catch (error: any) {
      toast({
        title: "Erro",
        description: "Erro ao carregar planos",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const createPlan = async (planData: Omit<SaasPlan, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      const { data, error } = await supabase
        .from('saas_plans')
        .insert(planData)
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Plano criado com sucesso!",
      });

      loadPlans();
      return data;
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message || "Erro ao criar plano",
        variant: "destructive",
      });
      throw error;
    }
  };

  const updatePlan = async (id: string, planData: Partial<SaasPlan>) => {
    try {
      const { error } = await supabase
        .from('saas_plans')
        .update(planData)
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Plano atualizado com sucesso!",
      });

      loadPlans();
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message || "Erro ao atualizar plano",
        variant: "destructive",
      });
      throw error;
    }
  };

  const deletePlan = async (id: string) => {
    try {
      const { error } = await supabase
        .from('saas_plans')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Plano excluído com sucesso!",
      });

      loadPlans();
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message || "Erro ao excluir plano",
        variant: "destructive",
      });
      throw error;
    }
  };

  useEffect(() => {
    loadPlans();
  }, []);

  return {
    plans,
    loading,
    loadPlans,
    createPlan,
    updatePlan,
    deletePlan,
  };
};
