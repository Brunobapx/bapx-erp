import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface TaxCalculationRule {
  id: string;
  rule_name: string;
  tax_regime: string;
  apply_to: string;
  filter_value?: string;
  icms_cst: string;
  icms_aliquota: number;
  icms_reducao_base: number;
  pis_cst: string;
  pis_aliquota: number;
  cofins_cst: string;
  cofins_aliquota: number;
  ipi_cst: string;
  ipi_aliquota: number;
  is_active: boolean;
  priority_order: number;
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
        .order('priority_order', { ascending: true });

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

  const getTaxRuleForProduct = (productCategory?: string, productNcm?: string) => {
    // Buscar regra mais específica primeiro
    let matchingRule = rules.find(rule => 
      rule.apply_to === 'by_ncm' && rule.filter_value === productNcm
    );

    if (!matchingRule && productCategory) {
      matchingRule = rules.find(rule => 
        rule.apply_to === 'by_category' && rule.filter_value === productCategory
      );
    }

    if (!matchingRule) {
      matchingRule = rules.find(rule => rule.apply_to === 'all_products');
    }

    return matchingRule;
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