import { useState, useEffect } from 'react';
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Client } from '@/hooks/useClients';
import { validateClientForm } from "./useClientFormValidation";
import { buildClientData } from "./buildClientData";

interface FormData {
  id: string;
  name: string;
  type: string;
  cnpj: string;
  ie: string;
  cpf: string;
  rg: string;
  email: string;
  phone: string;
  address: string;
  number: string;        // Novo campo
  complement: string;    // Novo campo
  city: string;
  state: string;
  zip: string;
  bairro?: string; // opcional
}

export const useClientForm = (clientData: Client | null, onClose: (refresh?: boolean) => void) => {
  const [formData, setFormData] = useState<FormData>({
    id: '',
    name: '',
    type: 'Jurídica',
    cnpj: '',
    ie: '',
    cpf: '',
    rg: '',
    email: '',
    phone: '',
    address: '',
    number: '',
    complement: '',
    city: '',
    state: '',
    zip: '',
    bairro: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isNewClient = !clientData?.id;
  
  useEffect(() => {
    if (clientData) {
      setFormData({
        id: clientData.id || '',
        name: clientData.name || '',
        type: clientData.type || 'Jurídica',
        cnpj: clientData.cnpj || '',
        ie: clientData.ie || '',
        cpf: clientData.cpf || '',
        rg: clientData.rg || '',
        email: clientData.email || '',
        phone: clientData.phone || '',
        address: clientData.address || '',
        number: (clientData as any).number || '',
        complement: (clientData as any).complement || '',
        city: clientData.city || '',
        state: clientData.state || '',
        zip: clientData.zip || '',
        bairro: (clientData as any).bairro || ''
      });
    } else {
      resetForm();
    }
  }, [clientData]);

  const resetForm = () => {
    setFormData({
      id: '',
      name: '',
      type: 'Jurídica',
      cnpj: '',
      ie: '',
      cpf: '',
      rg: '',
      email: '',
      phone: '',
      address: '',
      number: '',
      complement: '',
      city: '',
      state: '',
      zip: '',
      bairro: ''
    });
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleTypeChange = (value: string) => {
    setFormData(prev => ({ ...prev, type: value }));
  };

  const handleAutoAddressChange = (fields: Partial<FormData>) => {
    setFormData(prev => ({ ...prev, ...fields }));
  };

  const handleSubmit = async () => {
    if (!validateClientForm(formData)) return;

    try {
      setIsSubmitting(true);
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        toast.error("Usuário não autenticado. Faça login para continuar.");
        return;
      }

      const clientDataObj = buildClientData(formData, user.id);

      if (isNewClient) {
        const { error } = await supabase
          .from('clients')
          .insert([clientDataObj])
          .select();
        if (error) throw error;
        toast.success("Cliente adicionado com sucesso");
      } else {
        const { error } = await supabase
          .from('clients')
          .update(clientDataObj)
          .eq('id', formData.id)
          .select();
        if (error) throw error;
        toast.success("Cliente atualizado com sucesso");
      }
      onClose(true);
    } catch (error: any) {
      toast.error(`Erro ao ${isNewClient ? 'adicionar' : 'atualizar'} cliente: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    formData,
    isSubmitting,
    isNewClient,
    handleChange,
    handleTypeChange,
    handleAutoAddressChange,
    handleSubmit
  };
};
