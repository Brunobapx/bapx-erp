
import { useState, useEffect } from 'react';
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Client } from '@/hooks/useClients';

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
  city: string;
  state: string;
  zip: string;
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
    city: '',
    state: '',
    zip: ''
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
        city: clientData.city || '',
        state: clientData.state || '',
        zip: clientData.zip || ''
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
      city: '',
      state: '',
      zip: ''
    });
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleTypeChange = (value: string) => {
    setFormData(prev => ({ ...prev, type: value }));
  };

  const validateForm = () => {
    if (!formData.name.trim()) {
      toast.error("Nome/Razão Social é obrigatório");
      return false;
    }

    if (formData.type === 'Jurídica' && !formData.cnpj.trim()) {
      toast.error("CNPJ é obrigatório para Pessoa Jurídica");
      return false;
    }

    if (formData.type === 'Física' && !formData.cpf.trim()) {
      toast.error("CPF é obrigatório para Pessoa Física");
      return false;
    }

    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    try {
      setIsSubmitting(true);
      
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError || !user) {
        console.error('ClientModal - User not authenticated:', userError);
        toast.error("Usuário não autenticado. Faça login para continuar.");
        return;
      }

      console.log('ClientModal - Current user:', user.id);
      
      const clientData = {
        name: formData.name,
        type: formData.type,
        cnpj: formData.type === 'Jurídica' ? formData.cnpj : null,
        ie: formData.type === 'Jurídica' ? formData.ie : null,
        cpf: formData.type === 'Física' ? formData.cpf : null,
        rg: formData.type === 'Física' ? formData.rg : null,
        email: formData.email,
        phone: formData.phone,
        address: formData.address,
        city: formData.city,
        state: formData.state,
        zip: formData.zip,
        user_id: user.id
      };
      
      console.log('ClientModal - Saving client data:', clientData);
      
      if (isNewClient) {
        const { error } = await supabase
          .from('clients')
          .insert([clientData]);
          
        if (error) {
          console.error('ClientModal - Insert error:', error);
          throw error;
        }
        
        toast.success("Cliente adicionado com sucesso");
      } else {
        const { error } = await supabase
          .from('clients')
          .update(clientData)
          .eq('id', formData.id);
          
        if (error) {
          console.error('ClientModal - Update error:', error);
          throw error;
        }
        
        toast.success("Cliente atualizado com sucesso");
      }
      
      onClose(true);
    } catch (error: any) {
      console.error("ClientModal - Erro ao salvar cliente:", error);
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
    handleSubmit
  };
};
