
import { useState } from 'react';
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useCompanies } from "./useCompanies";

export type VendorFormData = {
  name: string;
  contact_person?: string;
  cnpj?: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  zip?: string;
  notes?: string;
};

export const useVendorInsert = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { getUserCompanyId } = useCompanies();

  const createVendor = async (vendorData: VendorFormData) => {
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

      const { data: vendor, error: vendorError } = await supabase
        .from('vendors')
        .insert({
          user_id: user.id,
          company_id: companyId,
          ...vendorData
        })
        .select()
        .single();

      if (vendorError) throw vendorError;

      toast.success('Fornecedor criado com sucesso!');
      return vendor;
      
    } catch (error: any) {
      console.error('Erro ao criar fornecedor:', error);
      toast.error('Erro ao criar fornecedor: ' + (error.message || 'Erro desconhecido'));
      throw error;
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    createVendor,
    isSubmitting
  };
};
