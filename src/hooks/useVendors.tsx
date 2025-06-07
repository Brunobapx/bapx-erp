
import { useState, useEffect } from 'react';
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

export type Vendor = {
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
  created_at?: string;
  updated_at?: string;
  user_id?: string;
};

export const useVendors = () => {
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchVendors = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('useVendors - Iniciando busca de fornecedores...');
      
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError) {
        console.error('useVendors - Erro de autenticação:', userError);
        throw new Error('Usuário não autenticado');
      }
      
      if (!user) {
        console.error('useVendors - Usuário não encontrado');
        throw new Error('Usuário não encontrado');
      }
      
      console.log('useVendors - Usuário autenticado:', user.id);

      const { data, error } = await supabase
        .from('vendors')
        .select('*')
        .eq('user_id', user.id)
        .order('name', { ascending: true });

      if (error) {
        console.error('useVendors - Erro do Supabase:', error);
        throw error;
      }

      console.log('useVendors - Dados recebidos do banco:', data);
      
      const vendorsData = Array.isArray(data) ? data : [];
      console.log('useVendors - Total de fornecedores carregados:', vendorsData.length);
      
      setVendors(vendorsData);
      
    } catch (err: any) {
      console.error('useVendors - Erro ao buscar fornecedores:', err);
      setError(err.message || 'Erro ao carregar fornecedores');
      
      if (!err.message?.includes('não autenticado')) {
        toast.error('Erro ao carregar fornecedores: ' + (err.message || 'Erro desconhecido'));
      }
      
      setVendors([]);
    } finally {
      setLoading(false);
    }
  };

  const deleteVendor = async (vendorId: string) => {
    try {
      console.log('useVendors - Excluindo fornecedor:', vendorId);
      
      const { error } = await supabase
        .from('vendors')
        .delete()
        .eq('id', vendorId);

      if (error) {
        console.error('useVendors - Erro ao excluir fornecedor:', error);
        throw error;
      }

      console.log('useVendors - Fornecedor excluído com sucesso');
      toast.success('Fornecedor excluído com sucesso!');
      
      // Atualizar lista local
      setVendors(prev => prev.filter(vendor => vendor.id !== vendorId));
      
    } catch (err: any) {
      console.error('useVendors - Erro ao excluir fornecedor:', err);
      toast.error('Erro ao excluir fornecedor: ' + (err.message || 'Erro desconhecido'));
      throw err;
    }
  };

  const refreshVendors = () => {
    console.log('useVendors - Atualizando lista de fornecedores...');
    fetchVendors();
  };

  useEffect(() => {
    fetchVendors();
  }, []);

  return {
    vendors,
    loading,
    error,
    deleteVendor,
    refreshVendors
  };
};
