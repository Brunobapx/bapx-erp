import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface CompanyFiscalSettings {
  // Dados da empresa
  company_name: string;
  company_fantasy_name: string;
  company_cnpj: string;
  company_ie: string;
  company_address: string;
  company_number: string;
  company_complement: string;
  company_neighborhood: string;
  company_city: string;
  company_state: string;
  company_cep: string;
  
  // Configurações tributárias
  tax_regime: string;
  default_cfop: string;
  default_ncm: string;
  
  // ICMS
  icms_cst: string;
  icms_origem: string;
  
  // PIS/COFINS
  pis_cst: string;
  pis_aliquota: string;
  cofins_cst: string;
  cofins_aliquota: string;

  // Configurações NFe
  nota_fiscal_tipo: string;
  nota_fiscal_ambiente: string;
  empresa_tipo: string;
  csosn_padrao: string;
  cst_padrao: string;
  icms_percentual: string;
  pis_percentual: string;
  cofins_percentual: string;
  focus_nfe_token: string;
  cnpj_emissor: string;
  focus_nfe_enabled: boolean;
  nfe_initial_number: string;
  
  // ICMS ST Destacado
  icms_st_destacado_por_item: boolean;
  icms_st_base_calculo_retido: string;
  icms_st_valor_retido: string;
  icms_st_aliquota: string;
  
  // FCP ST
  fcp_st_habilitado: boolean;
  fcp_st_base_calculo_retido: string;
  fcp_st_valor_retido: string;
  fcp_st_aliquota: string;
  
  // Valor Total de Tributos
  informar_valor_total_tributos: boolean;
  percentual_carga_tributaria: string;
}

export const useCompanyFiscalSettings = () => {
  const [settings, setSettings] = useState<CompanyFiscalSettings>({
    // Dados da empresa ARTISAN BREAD
    company_name: "ARTISAN BREAD PAES ARTESANAIS LTDA",
    company_fantasy_name: "ARTISAN",
    company_cnpj: "39.524.018/0001-28",
    company_ie: "11867847",
    company_address: "V PASTOR MARTIN LUTHER KING JR.",
    company_number: "11026",
    company_complement: "LOJA A",
    company_neighborhood: "ACARI",
    company_city: "Rio de Janeiro",
    company_state: "RJ", 
    company_cep: "21530-014",
    
    // Configurações tributárias
    tax_regime: "3", // Regime Normal
    default_cfop: "5405", // Venda com substituição tributária
    default_ncm: "19059090", // Outros produtos de padaria
    
    // ICMS - Substituição Tributária
    icms_cst: "60", // ICMS cobrado por substituição tributária
    icms_origem: "0", // Nacional
    
    // PIS/COFINS - Regime cumulativo
    pis_cst: "01", // Operação tributável com alíquota básica
    pis_aliquota: "1.65", // 1,65%
    cofins_cst: "01", // Operação tributável com alíquota básica  
    cofins_aliquota: "7.60", // 7,60%

    // Configurações NFe
    nota_fiscal_tipo: "nfe",
    nota_fiscal_ambiente: "homologacao",
    empresa_tipo: "MEI",
    csosn_padrao: "101",
    cst_padrao: "00",
    icms_percentual: "18",
    pis_percentual: "1.65",
    cofins_percentual: "7.6",
    focus_nfe_token: "",
    cnpj_emissor: "",
    focus_nfe_enabled: false,
    nfe_initial_number: "",
    
    // ICMS ST Destacado - apenas flag de habilitação
    icms_st_destacado_por_item: false,
    icms_st_base_calculo_retido: "",
    icms_st_valor_retido: "",
    icms_st_aliquota: "",
    
    // FCP ST - apenas flag de habilitação
    fcp_st_habilitado: false,
    fcp_st_base_calculo_retido: "",
    fcp_st_valor_retido: "",
    fcp_st_aliquota: "",
    
    // Valor Total de Tributos - flag + percentual para cálculo
    informar_valor_total_tributos: false,
    percentual_carga_tributaria: ""
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
          'company_name', 'company_cnpj', 'company_ie', 'company_city', 'company_state',
          'company_address', 'company_number', 'company_complement', 'company_neighborhood', 'company_cep', 'company_fantasy_name',
          'tax_regime', 'default_cfop', 'default_ncm', 'icms_cst', 'icms_origem',
          'pis_cst', 'pis_aliquota', 'cofins_cst', 'cofins_aliquota',
          'nota_fiscal_tipo', 'nota_fiscal_ambiente', 'empresa_tipo', 'csosn_padrao', 'cst_padrao',
          'icms_percentual', 'pis_percentual', 'cofins_percentual', 'focus_nfe_token', 'cnpj_emissor',
          'focus_nfe_enabled', 'nfe_initial_number',
          'icms_st_destacado_por_item', 'icms_st_base_calculo_retido', 'icms_st_valor_retido', 'icms_st_aliquota',
          'fcp_st_habilitado', 'fcp_st_base_calculo_retido', 'fcp_st_valor_retido', 'fcp_st_aliquota',
          'informar_valor_total_tributos', 'percentual_carga_tributaria'
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

      // Atualizar todos os campos
      setSettings(prev => ({
        ...prev,
        company_name: settingsMap.company_name || prev.company_name,
        company_cnpj: settingsMap.company_cnpj || prev.company_cnpj,
        company_ie: settingsMap.company_ie || prev.company_ie,
        company_city: settingsMap.company_city || prev.company_city,
        company_state: settingsMap.company_state || prev.company_state,
        company_address: settingsMap.company_address || prev.company_address,
        company_number: settingsMap.company_number || prev.company_number,
        company_complement: settingsMap.company_complement || prev.company_complement,
        company_neighborhood: settingsMap.company_neighborhood || prev.company_neighborhood,
        company_cep: settingsMap.company_cep || prev.company_cep,
        company_fantasy_name: settingsMap.company_fantasy_name || prev.company_fantasy_name,
        tax_regime: settingsMap.tax_regime || prev.tax_regime,
        default_cfop: settingsMap.default_cfop || prev.default_cfop,
        default_ncm: settingsMap.default_ncm || prev.default_ncm,
        icms_cst: settingsMap.icms_cst || prev.icms_cst,
        icms_origem: settingsMap.icms_origem || prev.icms_origem,
        pis_cst: settingsMap.pis_cst || prev.pis_cst,
        pis_aliquota: settingsMap.pis_aliquota || prev.pis_aliquota,
        cofins_cst: settingsMap.cofins_cst || prev.cofins_cst,
        cofins_aliquota: settingsMap.cofins_aliquota || prev.cofins_aliquota,
        nota_fiscal_tipo: settingsMap.nota_fiscal_tipo || prev.nota_fiscal_tipo,
        nota_fiscal_ambiente: settingsMap.nota_fiscal_ambiente || prev.nota_fiscal_ambiente,
        empresa_tipo: settingsMap.empresa_tipo || prev.empresa_tipo,
        csosn_padrao: settingsMap.csosn_padrao || prev.csosn_padrao,
        cst_padrao: settingsMap.cst_padrao || prev.cst_padrao,
        icms_percentual: settingsMap.icms_percentual || prev.icms_percentual,
        pis_percentual: settingsMap.pis_percentual || prev.pis_percentual,
        cofins_percentual: settingsMap.cofins_percentual || prev.cofins_percentual,
        focus_nfe_token: settingsMap.focus_nfe_token || prev.focus_nfe_token,
        cnpj_emissor: settingsMap.cnpj_emissor || prev.cnpj_emissor,
        focus_nfe_enabled: settingsMap.focus_nfe_enabled !== undefined ? settingsMap.focus_nfe_enabled : prev.focus_nfe_enabled,
        nfe_initial_number: settingsMap.nfe_initial_number || prev.nfe_initial_number,
        
        // Novos campos ICMS ST, FCP ST e vTotTrib
        icms_st_destacado_por_item: settingsMap.icms_st_destacado_por_item !== undefined ? settingsMap.icms_st_destacado_por_item : prev.icms_st_destacado_por_item,
        icms_st_base_calculo_retido: settingsMap.icms_st_base_calculo_retido || prev.icms_st_base_calculo_retido,
        icms_st_valor_retido: settingsMap.icms_st_valor_retido || prev.icms_st_valor_retido,
        icms_st_aliquota: settingsMap.icms_st_aliquota || prev.icms_st_aliquota,
        fcp_st_habilitado: settingsMap.fcp_st_habilitado !== undefined ? settingsMap.fcp_st_habilitado : prev.fcp_st_habilitado,
        fcp_st_base_calculo_retido: settingsMap.fcp_st_base_calculo_retido || prev.fcp_st_base_calculo_retido,
        fcp_st_valor_retido: settingsMap.fcp_st_valor_retido || prev.fcp_st_valor_retido,
        fcp_st_aliquota: settingsMap.fcp_st_aliquota || prev.fcp_st_aliquota,
        informar_valor_total_tributos: settingsMap.informar_valor_total_tributos !== undefined ? settingsMap.informar_valor_total_tributos : prev.informar_valor_total_tributos,
        percentual_carga_tributaria: settingsMap.percentual_carga_tributaria || prev.percentual_carga_tributaria
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
        { key: 'company_name', value: JSON.stringify(settings.company_name), category: 'company' },
        { key: 'company_cnpj', value: JSON.stringify(settings.company_cnpj), category: 'company' },
        { key: 'company_ie', value: JSON.stringify(settings.company_ie), category: 'company' },
        { key: 'company_city', value: JSON.stringify(settings.company_city), category: 'company' },
        { key: 'company_state', value: JSON.stringify(settings.company_state), category: 'company' },
        { key: 'company_address', value: JSON.stringify(settings.company_address), category: 'company' },
        { key: 'company_number', value: JSON.stringify(settings.company_number), category: 'company' },
        { key: 'company_complement', value: JSON.stringify(settings.company_complement), category: 'company' },
        { key: 'company_neighborhood', value: JSON.stringify(settings.company_neighborhood), category: 'company' },
        { key: 'company_cep', value: JSON.stringify(settings.company_cep), category: 'company' },
        { key: 'company_fantasy_name', value: JSON.stringify(settings.company_fantasy_name), category: 'company' },
        { key: 'tax_regime', value: JSON.stringify(settings.tax_regime), category: 'fiscal' },
        { key: 'default_cfop', value: JSON.stringify(settings.default_cfop), category: 'fiscal' },
        { key: 'default_ncm', value: JSON.stringify(settings.default_ncm), category: 'fiscal' },
        { key: 'icms_cst', value: JSON.stringify(settings.icms_cst), category: 'fiscal' },
        { key: 'icms_origem', value: JSON.stringify(settings.icms_origem), category: 'fiscal' },
        { key: 'pis_cst', value: JSON.stringify(settings.pis_cst), category: 'fiscal' },
        { key: 'pis_aliquota', value: JSON.stringify(settings.pis_aliquota), category: 'fiscal' },
        { key: 'cofins_cst', value: JSON.stringify(settings.cofins_cst), category: 'fiscal' },
        { key: 'cofins_aliquota', value: JSON.stringify(settings.cofins_aliquota), category: 'fiscal' },
        { key: 'nota_fiscal_tipo', value: JSON.stringify(settings.nota_fiscal_tipo), category: 'fiscal' },
        { key: 'nota_fiscal_ambiente', value: JSON.stringify(settings.nota_fiscal_ambiente), category: 'fiscal' },
        { key: 'empresa_tipo', value: JSON.stringify(settings.empresa_tipo), category: 'company' },
        { key: 'csosn_padrao', value: JSON.stringify(settings.csosn_padrao), category: 'fiscal' },
        { key: 'cst_padrao', value: JSON.stringify(settings.cst_padrao), category: 'fiscal' },
        { key: 'icms_percentual', value: JSON.stringify(settings.icms_percentual), category: 'fiscal' },
        { key: 'pis_percentual', value: JSON.stringify(settings.pis_percentual), category: 'fiscal' },
        { key: 'cofins_percentual', value: JSON.stringify(settings.cofins_percentual), category: 'fiscal' },
        { key: 'focus_nfe_token', value: JSON.stringify(settings.focus_nfe_token), category: 'fiscal' },
        { key: 'cnpj_emissor', value: JSON.stringify(settings.cnpj_emissor), category: 'company' },
        { key: 'focus_nfe_enabled', value: JSON.stringify(settings.focus_nfe_enabled), category: 'fiscal' },
        { key: 'nfe_initial_number', value: JSON.stringify(settings.nfe_initial_number), category: 'fiscal' },
        
        // Novos campos
        { key: 'icms_st_destacado_por_item', value: JSON.stringify(settings.icms_st_destacado_por_item), category: 'fiscal' },
        { key: 'icms_st_base_calculo_retido', value: JSON.stringify(settings.icms_st_base_calculo_retido), category: 'fiscal' },
        { key: 'icms_st_valor_retido', value: JSON.stringify(settings.icms_st_valor_retido), category: 'fiscal' },
        { key: 'icms_st_aliquota', value: JSON.stringify(settings.icms_st_aliquota), category: 'fiscal' },
        { key: 'fcp_st_habilitado', value: JSON.stringify(settings.fcp_st_habilitado), category: 'fiscal' },
        { key: 'fcp_st_base_calculo_retido', value: JSON.stringify(settings.fcp_st_base_calculo_retido), category: 'fiscal' },
        { key: 'fcp_st_valor_retido', value: JSON.stringify(settings.fcp_st_valor_retido), category: 'fiscal' },
        { key: 'fcp_st_aliquota', value: JSON.stringify(settings.fcp_st_aliquota), category: 'fiscal' },
        { key: 'informar_valor_total_tributos', value: JSON.stringify(settings.informar_valor_total_tributos), category: 'fiscal' },
        { key: 'percentual_carga_tributaria', value: JSON.stringify(settings.percentual_carga_tributaria), category: 'fiscal' }
      ];

      for (const update of updates) {
        const { error } = await supabase
          .from('system_settings')
          .upsert(update, { onConflict: 'company_id, key' });

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
      regime_description: settings.tax_regime === "1" ? 'Simples Nacional' : 
                         settings.tax_regime === "2" ? 'Simples Nacional - Excesso' : 'Regime Normal',
      cfop_description: 'Venda de mercadoria adquirida (com substituição tributária)',
      icms_description: 'ICMS por Substituição Tributária (já retido anteriormente)',
      pis_cofins_description: `Regime Cumulativo - PIS ${settings.pis_aliquota}% + COFINS ${settings.cofins_aliquota}%`,
      total_tax_rate: Number(settings.pis_aliquota) + Number(settings.cofins_aliquota)
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