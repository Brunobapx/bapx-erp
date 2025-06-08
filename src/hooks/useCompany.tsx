
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
    
    console.log('Detectando empresa - hostname:', hostname);
    
    // Se estiver em localhost ou for o domínio principal, usar 'main'
    if (hostname.includes('localhost') || hostname.includes('127.0.0.1')) {
      console.log('Ambiente local detectado - usando empresa: main');
      return 'main';
    }
    
    // Se estiver no Lovable (lovableproject.com ou lovable.app), usar 'main'
    if (hostname.includes('.lovableproject.com') || hostname.includes('.lovable.app')) {
      console.log('Ambiente Lovable detectado - usando empresa: main');
      return 'main';
    }
    
    // Para domínios personalizados, extrair subdomínio
    const subdomain = hostname.split('.')[0];
    
    // Se o subdomínio é igual ao hostname (domínio sem subdomínio), usar 'main'
    if (subdomain === hostname) {
      console.log('Domínio principal detectado - usando empresa: main');
      return 'main';
    }
    
    console.log('Subdomínio detectado:', subdomain);
    return subdomain;
  };

  const loadCompany = async () => {
    try {
      setLoading(true);
      const subdomain = detectCompanyFromSubdomain();
      
      console.log('Carregando empresa para subdomínio:', subdomain);
      
      const { data, error } = await supabase
        .from('companies')
        .select('*')
        .eq('subdomain', subdomain)
        .eq('is_active', true)
        .single();

      if (error) {
        console.error('Erro ao carregar empresa:', error);
        console.log('Tentativa de buscar empresa com subdomínio:', subdomain);
        return;
      }

      if (data) {
        setCompany(data);
        console.log('Empresa carregada com sucesso:', data);
        
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
      } else {
        console.warn('Nenhuma empresa encontrada para o subdomínio:', subdomain);
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
