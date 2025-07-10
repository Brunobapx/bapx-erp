import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface SellerCommission {
  id: string;
  user_id: string;
  commission_type: 'percentage' | 'fixed';
  commission_value: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export const useSellerCommissions = () => {
  const [commissions, setCommissions] = useState<SellerCommission[]>([]);
  const [loading, setLoading] = useState(false);

  const loadCommissions = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('seller_commissions')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setCommissions(data || []);
    } catch (error: any) {
      console.error('Erro ao carregar comissões de vendedores:', error);
      toast.error('Erro ao carregar comissões de vendedores');
    } finally {
      setLoading(false);
    }
  };

  const createCommission = async (commission: Omit<SellerCommission, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      const { data, error } = await supabase
        .from('seller_commissions')
        .insert([commission])
        .select()
        .single();

      if (error) throw error;
      
      toast.success('Comissão de vendedor criada com sucesso');
      await loadCommissions();
      return data;
    } catch (error: any) {
      console.error('Erro ao criar comissão de vendedor:', error);
      toast.error('Erro ao criar comissão de vendedor');
      throw error;
    }
  };

  const updateCommission = async (id: string, updates: Partial<SellerCommission>) => {
    try {
      const { data, error } = await supabase
        .from('seller_commissions')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      
      toast.success('Comissão de vendedor atualizada com sucesso');
      await loadCommissions();
      return data;
    } catch (error: any) {
      console.error('Erro ao atualizar comissão de vendedor:', error);
      toast.error('Erro ao atualizar comissão de vendedor');
      throw error;
    }
  };

  const deleteCommission = async (id: string) => {
    try {
      const { error } = await supabase
        .from('seller_commissions')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      toast.success('Comissão de vendedor removida com sucesso');
      await loadCommissions();
    } catch (error: any) {
      console.error('Erro ao remover comissão de vendedor:', error);
      toast.error('Erro ao remover comissão de vendedor');
      throw error;
    }
  };

  const getCommissionByUserId = async (userId: string): Promise<SellerCommission | null> => {
    try {
      const { data, error } = await supabase
        .from('seller_commissions')
        .select('*')
        .eq('user_id', userId)
        .eq('is_active', true)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      return data || null;
    } catch (error: any) {
      console.error('Erro ao buscar comissão do vendedor:', error);
      return null;
    }
  };

  useEffect(() => {
    loadCommissions();
  }, []);

  return {
    commissions,
    loading,
    createCommission,
    updateCommission,
    deleteCommission,
    getCommissionByUserId,
    refetch: loadCommissions
  };
};