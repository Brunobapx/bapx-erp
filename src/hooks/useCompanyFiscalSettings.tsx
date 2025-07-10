import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface CompanyFiscalSettings {
  // Dados da empresa ARTISAN BREAD
  company_name: string;
  company_fantasy_name: string;
  company_cnpj: string;
  company_ie: string;
  company_address: string;
  company_number: string;
  company_neighborhood: string;
  company_city: string;
  company_state: string;
  company_cep: string;
  
  // Configurações tributárias
  tax_regime: number; // 1=Simples, 2=Simples Excesso, 3=Normal
  default_cfop: string;
  default_ncm: string;
  
  // ICMS
  icms_cst: string;
  icms_origem: number;
  
  // PIS/COFINS
  pis_cst: string;
  pis_aliquota: number;
  cofins_cst: string;
  cofins_aliquota: number;
}

export const useCompanyFiscalSettings = () => {
  const [settings, setSettings] = useState<CompanyFiscalSettings>({
    // Dados fixos da ARTISAN BREAD baseados na NFe analisada
    company_name: "ARTISAN BREAD PAES ARTESANAIS LTDA",
    company_fantasy_name: "ARTISAN",
    company_cnpj: "39.524.018/0001-28",
    company_ie: "11867847",
    company_address: "",
    company_number: "",
    company_neighborhood: "",
    company_city: "Rio de Janeiro",
    company_state: "RJ", 
    company_cep: "",
    
    // Configurações tributárias baseadas na análise
    tax_regime: 3, // Regime Normal (baseado no porte)
    default_cfop: "5405", // Venda com substituição tributária
    default_ncm: "19059090", // Outros produtos de padaria
    
    // ICMS - Substituição Tributária
    icms_cst: "60", // ICMS cobrado por substituição tributária
    icms_origem: 0, // Nacional
    
    // PIS/COFINS - Regime cumulativo
    pis_cst: "01", // Operação tributável com alíquota básica
    pis_aliquota: 0.65, // 0,65%
    cofins_cst: "01", // Operação tributável com alíquota básica  
    cofins_aliquota: 3.00 // 3%
  });

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const loadSettings = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('system_settings')
        .select('key, value')
        .in('key', [
          'company_address', 'company_number', 'company_neighborhood', 'company_cep'
        ]);

      if (error) throw error;

      const settingsMap = data.reduce((acc, setting) => {
        try {
          acc[setting.key] = JSON.parse(setting.value as string);
        } catch {
          acc[setting.key] = setting.value;
        }
        return acc;
      }, {} as Record<string, any>);

      // Atualizar apenas os campos variáveis
      setSettings(prev => ({
        ...prev,
        company_address: settingsMap.company_address || "",
        company_number: settingsMap.company_number || "",
        company_neighborhood: settingsMap.company_neighborhood || "",
        company_cep: settingsMap.company_cep || ""
      }));

    } catch (error) {
      console.error('Erro ao carregar configurações:', error);
      toast.error('Erro ao carregar configurações da empresa');
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = async () => {
    setSaving(true);
    try {
      const updates = [
        { key: 'company_address', value: JSON.stringify(settings.company_address), category: 'company' },
        { key: 'company_number', value: JSON.stringify(settings.company_number), category: 'company' },
        { key: 'company_neighborhood', value: JSON.stringify(settings.company_neighborhood), category: 'company' },
        { key: 'company_cep', value: JSON.stringify(settings.company_cep), category: 'company' }
      ];

      for (const update of updates) {
        const { error } = await supabase
          .from('system_settings')
          .upsert(update, { onConflict: 'key' });

        if (error) throw error;
      }

      toast.success('Configurações da empresa salvas com sucesso!');
    } catch (error) {
      console.error('Erro ao salvar configurações:', error);
      toast.error('Erro ao salvar configurações da empresa');
    } finally {
      setSaving(false);
    }
  };

  const getTaxInfo = () => {
    return {
      // Informações para exibição
      regime_description: settings.tax_regime === 1 ? 'Simples Nacional' : 
                         settings.tax_regime === 2 ? 'Simples Nacional - Excesso' : 'Regime Normal',
      cfop_description: 'Venda de mercadoria adquirida (com substituição tributária)',
      icms_description: 'ICMS por Substituição Tributária (já retido anteriormente)',
      pis_cofins_description: 'Regime Cumulativo - PIS 0,65% + COFINS 3%',
      total_tax_rate: settings.pis_aliquota + settings.cofins_aliquota // 3,65%
    };
  };

  useEffect(() => {
    loadSettings();
  }, []);

  return {
    settings,
    setSettings,
    loading,
    saving,
    saveSettings,
    getTaxInfo
  };
};