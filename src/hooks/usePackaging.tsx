
import { useState, useEffect } from 'react';
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

export type PackagingStatus = 
  | 'pending'
  | 'in_progress'
  | 'completed'
  | 'approved'
  | 'rejected';

export type Packaging = {
  id: string;
  packaging_number: string;
  production_id: string;
  product_id: string;
  product_name: string;
  quantity_to_package: number;
  quantity_packaged: number;
  status: PackagingStatus;
  packaged_by?: string;
  packaged_at?: string;
  approved_by?: string;
  approved_at?: string;
  quality_check: boolean;
  notes?: string;
  created_at?: string;
  updated_at?: string;
  user_id?: string;
};

export const usePackaging = () => {
  const [packagings, setPackagings] = useState<Packaging[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  useEffect(() => {
    const fetchPackagings = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        
        if (userError || !user) {
          throw new Error('Usuário não autenticado');
        }

        const { data, error } = await supabase
          .from('packaging')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });
        
        if (error) throw error;
        
        setPackagings(data || []);
      } catch (error: any) {
        console.error('Erro ao carregar embalagem:', error);
        setError(error.message || 'Erro ao carregar embalagem');
        toast.error('Erro ao carregar embalagem');
      } finally {
        setLoading(false);
      }
    };

    fetchPackagings();
  }, [refreshTrigger]);

  const refreshPackagings = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  const updatePackagingStatus = async (
    id: string, 
    status: PackagingStatus, 
    quantityPackaged?: number,
    qualityCheck?: boolean
  ) => {
    try {
      const updateData: any = { 
        status,
        updated_at: new Date().toISOString()
      };
      
      if (quantityPackaged) {
        updateData.quantity_packaged = quantityPackaged;
      }
      
      if (qualityCheck !== undefined) {
        updateData.quality_check = qualityCheck;
      }
      
      if (status === 'completed') {
        updateData.packaged_at = new Date().toISOString();
        const { data: { user } } = await supabase.auth.getUser();
        updateData.packaged_by = user?.email || 'Sistema';
      }
      
      if (status === 'approved') {
        updateData.approved_at = new Date().toISOString();
        const { data: { user } } = await supabase.auth.getUser();
        updateData.approved_by = user?.email || 'Sistema';
      }

      const { error } = await supabase
        .from('packaging')
        .update(updateData)
        .eq('id', id);
      
      if (error) throw error;
      
      toast.success('Status de embalagem atualizado com sucesso');
      refreshPackagings();
      return true;
    } catch (error: any) {
      console.error('Erro ao atualizar embalagem:', error);
      toast.error('Erro ao atualizar embalagem');
      return false;
    }
  };

  return {
    packagings,
    loading,
    error,
    refreshPackagings,
    updatePackagingStatus
  };
};
