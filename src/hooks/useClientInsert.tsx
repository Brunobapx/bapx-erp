
import { useState } from 'react';
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useCompanies } from "./useCompanies";

export type ClientFormData = {
  name: string;
  type: 'Física' | 'Jurídica';
  cpf?: string;
  rg?: string;
  cnpj?: string;
  ie?: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  zip?: string;
};

export const useClientInsert = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { getUserCompanyId } = useCompanies();

  const createClient = async (clientData: ClientFormData) => {
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

      const { data: client, error: clientError } = await supabase
        .from('clients')
        .insert({
          user_id: user.id,
          company_id: companyId,
          ...clientData
        })
        .select()
        .single();

      if (clientError) throw clientError;

      toast.success('Cliente criado com sucesso!');
      return client;
      
    } catch (error: any) {
      console.error('Erro ao criar cliente:', error);
      toast.error('Erro ao criar cliente: ' + (error.message || 'Erro desconhecido'));
      throw error;
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    createClient,
    isSubmitting
  };
};
