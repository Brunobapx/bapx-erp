import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface TaxCalculationRule {
  id: string;
  company_id: string;
  user_id: string;
  rule_name: string;
  regime_tributario: string;
  icms_rate: number;
  ipi_rate: number;
  pis_rate: number;
  cofins_rate: number;
  csosn?: string;
  cst?: string;
  cfop_default?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export const useTaxCalculationRules = () => {
  const [rules, setRules] = useState<TaxCalculationRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const loadRules = async () => {
    try {
      const { data, error } = await supabase
        .from('tax_calculation_rules')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setRules(data || []);
    } catch (error) {
      console.error('Erro ao carregar regras de cálculo:', error);
      toast.error('Erro ao carregar regras de cálculo');
    } finally {
      setLoading(false);
    }
  };

  const saveRule = async (rule: Partial<TaxCalculationRule>) => {
    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      const ruleData = {
        ...rule,
        user_id: user.id,
      };

      if (rule.id) {
        const { error } = await supabase
          .from('tax_calculation_rules')
          .update(ruleData)
          .eq('id', rule.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('tax_calculation_rules')
          .insert(ruleData);
        if (error) throw error;
      }

      toast.success('Regra de cálculo salva com sucesso!');
      loadRules();
    } catch (error) {
      console.error('Erro ao salvar regra de cálculo:', error);
      toast.error('Erro ao salvar regra de cálculo');
    } finally {
      setSaving(false);
    }
  };

  const deleteRule = async (id: string) => {
    try {
      const { error } = await supabase
        .from('tax_calculation_rules')
        .update({ is_active: false })
        .eq('id', id);

      if (error) throw error;
      toast.success('Regra de cálculo removida com sucesso!');
      loadRules();
    } catch (error) {
      console.error('Erro ao remover regra de cálculo:', error);
      toast.error('Erro ao remover regra de cálculo');
    }
  };

  const getTaxRuleForProduct = (regime?: string) => {
    // Buscar regra por regime tributário
    return rules.find(rule => rule.regime_tributario === regime) || rules[0];
  };

  useEffect(() => {
    loadRules();
  }, []);

  return {
    rules,
    loading,
    saving,
    saveRule,
    deleteRule,
    getTaxRuleForProduct,
    reload: loadRules
  };
};