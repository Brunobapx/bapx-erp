import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface SellerUser {
  user_id: string;
  role: string;
  created_at: string;
}

export const useSellerUsers = () => {
  const [sellers, setSellers] = useState<SellerUser[]>([]);
  const [loading, setLoading] = useState(false);

  const loadSellers = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('user_roles')
        .select('user_id, role, created_at')
        .eq('role', 'seller')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setSellers(data || []);
    } catch (error: any) {
      console.error('Erro ao carregar vendedores:', error);
      toast.error('Erro ao carregar vendedores');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSellers();
  }, []);

  return {
    sellers,
    loading,
    refetch: loadSellers
  };
};