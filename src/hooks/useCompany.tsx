
import { useState, useEffect } from 'react';
import { supabase } from "@/integrations/supabase/client";

export interface Company {
  id: string;
  name: string;
  subdomain: string;
  settings: any;
  logo_url?: string;
  primary_color: string;
  secondary_color: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export const useCompany = () => {
  const [company, setCompany] = useState<Company | null>(null);
  const [loading, setLoading] = useState(true);

  // Detectar empresa pelo subdomínio
  const detectCompanyFromSubdomain = () => {
    const hostname = window.location.hostname;
    const subdomain = hostname.split('.')[0];
    
    // Se estiver em localhost ou for o domínio principal, usar 'main'
    if (hostname.includes('localhost') || hostname.includes('127.0.0.1') || subdomain === hostname) {
      return 'main';
    }
    
    return subdomain;
  };

  const loadCompany = async () => {
    try {
      setLoading(true);
      const subdomain = detectCompanyFromSubdomain();
      
      console.log('Detectando empresa pelo subdomínio:', subdomain);
      
      const { data, error } = await supabase
        .from('companies')
        .select('*')
        .eq('subdomain', subdomain)
        .eq('is_active', true)
        .single();

      if (error) {
        console.error('Erro ao carregar empresa:', error);
        return;
      }

      if (data) {
        setCompany(data);
        console.log('Empresa carregada:', data);
        
        // Aplicar cores da empresa no CSS
        if (data.primary_color || data.secondary_color) {
          const root = document.documentElement;
          if (data.primary_color) {
            root.style.setProperty('--primary', data.primary_color);
          }
          if (data.secondary_color) {
            root.style.setProperty('--secondary', data.secondary_color);
          }
        }
      }
    } catch (error) {
      console.error('Erro ao detectar empresa:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCompany();
  }, []);

  return {
    company,
    loading,
    detectCompanyFromSubdomain,
    loadCompany
  };
};
