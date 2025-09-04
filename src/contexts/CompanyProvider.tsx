import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface Company {
  id: string;
  code: string;
  name: string;
  logo_url?: string;
  primary_color?: string;
  secondary_color?: string;
  email?: string;
  telefone?: string;
  whatsapp?: string;
}

interface EcommerceSettings {
  id: string;
  company_id: string;
  store_name: string;
  store_description?: string;
  store_logo_url?: string;
  is_active: boolean;
  theme_settings: {
    primary_color: string;
    secondary_color: string;
  };
  payment_methods: string[];
  shipping_settings: {
    default_shipping: number;
    free_shipping_min: number;
  };
}

interface CompanyContextType {
  company: Company | null;
  ecommerceSettings: EcommerceSettings | null;
  loading: boolean;
  error: string | null;
  loadCompanyByCode: (code: string) => Promise<void>;
  loadCompanyByDomain: (domain: string) => Promise<void>;
}

const CompanyContext = createContext<CompanyContextType | undefined>(undefined);

export function CompanyProvider({ children }: { children: React.ReactNode }) {
  const [company, setCompany] = useState<Company | null>(null);
  const [ecommerceSettings, setEcommerceSettings] = useState<EcommerceSettings | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadCompanyByCode = async (code: string) => {
    try {
      setLoading(true);
      setError(null);

      // Buscar empresa pelo código
      const { data: companyData, error: companyError } = await supabase
        .from('companies')
        .select('*')
        .eq('code', code)
        .single();

      if (companyError || !companyData) {
        throw new Error('Empresa não encontrada');
      }

      // Buscar configurações de e-commerce
      const { data: settingsData, error: settingsError } = await supabase
        .from('company_ecommerce_settings')
        .select('*')
        .eq('company_id', companyData.id)
        .eq('is_active', true)
        .single();

      if (settingsError || !settingsData) {
        throw new Error('Loja não encontrada ou inativa');
      }

      setCompany(companyData);
      setEcommerceSettings(settingsData);

      // Aplicar tema da empresa
      applyCompanyTheme(settingsData.theme_settings);

    } catch (err) {
      console.error('Error loading company:', err);
      setError(err instanceof Error ? err.message : 'Erro ao carregar loja');
      setCompany(null);
      setEcommerceSettings(null);
    } finally {
      setLoading(false);
    }
  };

  const loadCompanyByDomain = async (domain: string) => {
    try {
      setLoading(true);
      setError(null);

      // Buscar empresa pelo domínio personalizado
      const { data: settingsData, error: settingsError } = await supabase
        .from('company_ecommerce_settings')
        .select(`
          *,
          companies!inner(*)
        `)
        .eq('custom_domain', domain)
        .eq('is_active', true)
        .single();

      if (settingsError || !settingsData) {
        throw new Error('Loja não encontrada para este domínio');
      }

      setCompany(settingsData.companies);
      setEcommerceSettings(settingsData);

      // Aplicar tema da empresa
      applyCompanyTheme(settingsData.theme_settings);

    } catch (err) {
      console.error('Error loading company by domain:', err);
      setError(err instanceof Error ? err.message : 'Erro ao carregar loja');
      setCompany(null);
      setEcommerceSettings(null);
    } finally {
      setLoading(false);
    }
  };

  const applyCompanyTheme = (themeSettings: any) => {
    if (themeSettings?.primary_color) {
      document.documentElement.style.setProperty('--primary', convertToHSL(themeSettings.primary_color));
    }
    if (themeSettings?.secondary_color) {
      document.documentElement.style.setProperty('--secondary', convertToHSL(themeSettings.secondary_color));
    }
  };

  const convertToHSL = (hex: string) => {
    // Convert hex to HSL - simple conversion for demo
    // In a real app, you'd use a proper color conversion library
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    
    const max = Math.max(r, g, b) / 255;
    const min = Math.min(r, g, b) / 255;
    const diff = max - min;
    const add = max + min;
    const l = add * 0.5;
    
    let s = 0;
    let h = 0;
    
    if (diff !== 0) {
      s = l < 0.5 ? diff / add : diff / (2 - add);
      
      switch (max) {
        case r / 255:
          h = ((g - b) / 255 - diff) / diff + (g < b ? 6 : 0);
          break;
        case g / 255:
          h = ((b - r) / 255 - diff) / diff + 2;
          break;
        case b / 255:
          h = ((r - g) / 255 - diff) / diff + 4;
          break;
      }
      h /= 6;
    }
    
    return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
  };

  return (
    <CompanyContext.Provider
      value={{
        company,
        ecommerceSettings,
        loading,
        error,
        loadCompanyByCode,
        loadCompanyByDomain,
      }}
    >
      {children}
    </CompanyContext.Provider>
  );
}

export function useCompanyStore() {
  const context = useContext(CompanyContext);
  if (context === undefined) {
    throw new Error('useCompanyStore must be used within a CompanyProvider');
  }
  return context;
}