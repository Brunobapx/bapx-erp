
import { useState } from 'react';
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useCompanies } from "./useCompanies";

export type ProductFormData = {
  code?: string;
  name: string;
  description?: string;
  sku?: string;
  category?: string;
  unit?: string;
  price?: number;
  cost?: number;
  stock?: number;
  weight?: number;
  is_manufactured?: boolean;
  ncm?: string;
  tax_type?: string;
  icms?: string;
  ipi?: string;
  pis?: string;
  cofins?: string;
};

export const useProductInsert = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { getUserCompanyId } = useCompanies();

  const createProduct = async (productData: ProductFormData) => {
    setIsSubmitting(true);
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError || !user) {
        throw new Error('Usuário não autenticado');
      }

      const companyId = await getUserCompanyId();
      if (!companyId) {
        throw new Error('Company ID não encontrado');
      }

      const { data: product, error: productError } = await supabase
        .from('products')
        .insert({
          user_id: user.id,
          company_id: companyId,
          ...productData
        })
        .select()
        .single();

      if (productError) throw productError;

      toast.success('Produto criado com sucesso!');
      return product;
      
    } catch (error: any) {
      console.error('Erro ao criar produto:', error);
      toast.error('Erro ao criar produto: ' + (error.message || 'Erro desconhecido'));
      throw error;
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    createProduct,
    isSubmitting
  };
};
