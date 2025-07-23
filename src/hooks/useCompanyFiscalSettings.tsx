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
    
    // PIS/COFINS - Regime cumulativo (corrigido conforme XML)
    pis_cst: "01", // Operação tributável com alíquota básica
    pis_aliquota: 1.65, // 1,65% - corrigido
    cofins_cst: "01", // Operação tributável com alíquota básica  
    cofins_aliquota: 7.60 // 7,60% - corrigido
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
          'company_address', 'company_number', 'company_neighborhood', 'company_cep',
          'tax_regime', 'default_cfop', 'default_ncm', 'icms_cst', 'icms_origem',
          'pis_cst', 'pis_aliquota', 'cofins_cst', 'cofins_aliquota'
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

      // Atualizar todos os campos variáveis
      setSettings(prev => ({
        ...prev,
        company_address: settingsMap.company_address || "",
        company_number: settingsMap.company_number || "",
        company_neighborhood: settingsMap.company_neighborhood || "",
        company_cep: settingsMap.company_cep || "",
        tax_regime: settingsMap.tax_regime || prev.tax_regime,
        default_cfop: settingsMap.default_cfop || prev.default_cfop,
        default_ncm: settingsMap.default_ncm || prev.default_ncm,
        icms_cst: settingsMap.icms_cst || prev.icms_cst,
        icms_origem: settingsMap.icms_origem !== undefined ? settingsMap.icms_origem : prev.icms_origem,
        pis_cst: settingsMap.pis_cst || prev.pis_cst,
        pis_aliquota: settingsMap.pis_aliquota !== undefined ? settingsMap.pis_aliquota : prev.pis_aliquota,
        cofins_cst: settingsMap.cofins_cst || prev.cofins_cst,
        cofins_aliquota: settingsMap.cofins_aliquota !== undefined ? settingsMap.cofins_aliquota : prev.cofins_aliquota
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
        { key: 'company_cep', value: JSON.stringify(settings.company_cep), category: 'company' },
        { key: 'tax_regime', value: JSON.stringify(settings.tax_regime), category: 'fiscal' },
        { key: 'default_cfop', value: JSON.stringify(settings.default_cfop), category: 'fiscal' },
        { key: 'default_ncm', value: JSON.stringify(settings.default_ncm), category: 'fiscal' },
        { key: 'icms_cst', value: JSON.stringify(settings.icms_cst), category: 'fiscal' },
        { key: 'icms_origem', value: JSON.stringify(settings.icms_origem), category: 'fiscal' },
        { key: 'pis_cst', value: JSON.stringify(settings.pis_cst), category: 'fiscal' },
        { key: 'pis_aliquota', value: JSON.stringify(settings.pis_aliquota), category: 'fiscal' },
        { key: 'cofins_cst', value: JSON.stringify(settings.cofins_cst), category: 'fiscal' },
        { key: 'cofins_aliquota', value: JSON.stringify(settings.cofins_aliquota), category: 'fiscal' }
      ];

      for (const update of updates) {
        const { error } = await supabase
          .from('system_settings')
          .upsert(update, { onConflict: 'key' });

        if (error) throw error;
      }

      toast.success('Configurações salvas com sucesso!');
    } catch (error) {
      console.error('Erro ao salvar configurações:', error);
      toast.error('Erro ao salvar configurações');
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
      pis_cofins_description: 'Regime Cumulativo - PIS 1,65% + COFINS 7,60%',
      total_tax_rate: settings.pis_aliquota + settings.cofins_aliquota // 9,25%
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