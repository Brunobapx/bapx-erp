
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/components/Auth/AuthProvider';

export interface Vendor {
  id: string;
  name: string;
  cnpj?: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  zip?: string;
  contact_person?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export const useVendors = () => {
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const { user } = useAuth();

  const loadVendors = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      setError(null);
      console.log('[useVendors] Carregando fornecedores da empresa');
      
      const { data, error } = await supabase
        .from('vendors')
        .select('*')
        .order('name');

      if (error) throw error;

      console.log('[useVendors] Fornecedores carregados:', data?.length);
      setVendors(data || []);
    } catch (error: any) {
      console.error('[useVendors] Erro ao carregar fornecedores:', error);
      const errorMessage = error.message || "Erro ao carregar fornecedores";
      setError(errorMessage);
      toast({
        title: "Erro",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const createVendor = async (vendorData: Omit<Vendor, 'id' | 'created_at' | 'updated_at'>) => {
    if (!user) throw new Error('Usuário não autenticado');

    try {
      const { data, error } = await supabase
        .from('vendors')
        .insert([{
          ...vendorData,
          user_id: user.id,
        }])
        .select()
        .single();

      if (error) throw error;

      await loadVendors();
      toast({
        title: "Sucesso",
        description: "Fornecedor criado com sucesso!",
      });

      return data;
    } catch (error: any) {
      console.error('[useVendors] Erro ao criar fornecedor:', error);
      toast({
        title: "Erro",
        description: error.message || "Erro ao criar fornecedor",
        variant: "destructive",
      });
      throw error;
    }
  };

  const updateVendor = async (id: string, vendorData: Partial<Vendor>) => {
    try {
      const { error } = await supabase
        .from('vendors')
        .update(vendorData)
        .eq('id', id);

      if (error) throw error;

      await loadVendors();
      toast({
        title: "Sucesso",
        description: "Fornecedor atualizado com sucesso!",
      });
    } catch (error: any) {
      console.error('[useVendors] Erro ao atualizar fornecedor:', error);
      toast({
        title: "Erro",
        description: error.message || "Erro ao atualizar fornecedor",
        variant: "destructive",
      });
      throw error;
    }
  };

  const deleteVendor = async (id: string) => {
    try {
      const { error } = await supabase
        .from('vendors')
        .delete()
        .eq('id', id);

      if (error) throw error;

      await loadVendors();
      toast({
        title: "Sucesso",
        description: "Fornecedor excluído com sucesso!",
      });
    } catch (error: any) {
      console.error('[useVendors] Erro ao excluir fornecedor:', error);
      toast({
        title: "Erro",
        description: error.message || "Erro ao excluir fornecedor",
        variant: "destructive",
      });
      throw error;
    }
  };

  const refreshVendors = loadVendors;

  useEffect(() => {
    loadVendors();
  }, [user]);

  return {
    vendors,
    loading,
    error,
    loadVendors,
    refreshVendors,
    createVendor,
    updateVendor,
    deleteVendor,
  };
};
