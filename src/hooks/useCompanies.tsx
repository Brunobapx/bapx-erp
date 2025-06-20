
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface Company {
  id: string;
  name: string;
  subdomain: string;
  logo_url?: string;
  primary_color?: string;
  secondary_color?: string;
  billing_email?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export const useCompanies = () => {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const loadCompanies = async () => {
    try {
      const { data, error } = await supabase
        .from('companies')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setCompanies(data || []);
    } catch (error: any) {
      toast({
        title: "Erro",
        description: "Erro ao carregar empresas",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getUserCompanyId = async (): Promise<string | null> => {
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError || !user) {
        return null;
      }

      const { data, error } = await supabase
        .from('profiles')
        .select('company_id')
        .eq('id', user.id)
        .single();

      if (error) throw error;
      return data?.company_id || null;
    } catch (error) {
      console.error('Erro ao obter company_id:', error);
      return null;
    }
  };

  useEffect(() => {
    loadCompanies();
  }, []);

  return {
    companies,
    loading,
    loadCompanies,
    getUserCompanyId,
  };
};
