import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface CompanyInfo {
  company_name: string;
  company_cnpj: string;
  company_fantasy_name: string;
  company_ie: string;
  company_city: string;
  company_state: string;
  company_address: string;
  company_number: string;
  company_neighborhood: string;
  company_cep: string;
  company_complement: string;
  // Campos da tabela companies
  billing_email: string;
  whatsapp: string;
}

export const useCompanyInfo = () => {
  const [companyInfo, setCompanyInfo] = useState<CompanyInfo>({
    company_name: '',
    company_cnpj: '',
    company_fantasy_name: '',
    company_ie: '',
    company_city: '',
    company_state: '',
    company_address: '',
    company_number: '',
    company_neighborhood: '',
    company_cep: '',
    company_complement: '',
    billing_email: '',
    whatsapp: '',
  });
  
  const [loading, setLoading] = useState(true);

  const loadCompanyInfo = async () => {
    try {
      setLoading(true);
      
      // Buscar configurações da empresa
      const { data: settingsData, error: settingsError } = await supabase
        .from('system_settings')
        .select('key, value')
        .in('key', [
          'company_name',
          'company_cnpj',
          'company_fantasy_name',
          'company_ie',
          'company_city',
          'company_state',
          'company_address',
          'company_number',
          'company_neighborhood',
          'company_cep',
          'company_complement'
        ]);

      if (settingsError) throw settingsError;

      const settingsMap = settingsData.reduce((acc, setting) => {
        try {
          acc[setting.key] = JSON.parse(setting.value as string);
        } catch {
          acc[setting.key] = setting.value;
        }
        return acc;
      }, {} as Record<string, any>);

      // Buscar informações adicionais da tabela companies
      const { data: { user } } = await supabase.auth.getUser();
      let companyData = null;
      
      if (user) {
        const { data: profileData } = await supabase
          .from('profiles')
          .select('company_id')
          .eq('id', user.id)
          .single();

        if (profileData?.company_id) {
          const { data: company } = await supabase
            .from('companies')
            .select('billing_email, whatsapp')
            .eq('id', profileData.company_id)
            .single();
          
          companyData = company;
        }
      }

      setCompanyInfo({
        company_name: settingsMap.company_name || 'Empresa',
        company_cnpj: settingsMap.company_cnpj || '',
        company_fantasy_name: settingsMap.company_fantasy_name || '',
        company_ie: settingsMap.company_ie || '',
        company_city: settingsMap.company_city || '',
        company_state: settingsMap.company_state || '',
        company_address: settingsMap.company_address || '',
        company_number: settingsMap.company_number || '',
        company_neighborhood: settingsMap.company_neighborhood || '',
        company_cep: settingsMap.company_cep || '',
        company_complement: settingsMap.company_complement || '',
        billing_email: companyData?.billing_email || '',
        whatsapp: companyData?.whatsapp || '',
      });

    } catch (error) {
      console.error('Erro ao carregar informações da empresa:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCompanyInfo();
  }, []);

  return {
    companyInfo,
    loading,
    reload: loadCompanyInfo
  };
};