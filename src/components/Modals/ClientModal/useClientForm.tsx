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
      console.log('ClientForm - Carregando dados do cliente:', clientData);
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
      console.log('ClientForm - Novo cliente, resetando formulário');
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

  const handleAutoAddressChange = (fields: Partial<FormData>) => {
    setFormData(prev => ({ ...prev, ...fields }));
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
      
      console.log('ClientForm - Iniciando salvamento do cliente...');
      
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError || !user) {
        console.error('ClientForm - Usuário não autenticado:', userError);
        toast.error("Usuário não autenticado. Faça login para continuar.");
        return;
      }

      console.log('ClientForm - Usuário autenticado:', user.id);
      
      const clientData = {
        name: formData.name,
        type: formData.type as 'Física' | 'Jurídica',
        cnpj: formData.type === 'Jurídica' ? formData.cnpj : null,
        ie: formData.type === 'Jurídica' ? formData.ie : null,
        cpf: formData.type === 'Física' ? formData.cpf : null,
        rg: formData.type === 'Física' ? formData.rg : null,
        email: formData.email || null,
        phone: formData.phone || null,
        address: formData.address || null,
        city: formData.city || null,
        state: formData.state || null,
        zip: formData.zip || null,
        user_id: user.id
      };
      
      console.log('ClientForm - Dados para salvar:', clientData);
      
      if (isNewClient) {
        console.log('ClientForm - Criando novo cliente...');
        const { data: insertData, error } = await supabase
          .from('clients')
          .insert([clientData])
          .select();
          
        if (error) {
          console.error('ClientForm - Erro ao inserir:', error);
          throw error;
        }
        
        console.log('ClientForm - Cliente criado com sucesso:', insertData);
        toast.success("Cliente adicionado com sucesso");
      } else {
        console.log('ClientForm - Atualizando cliente existente...');
        const { data: updateData, error } = await supabase
          .from('clients')
          .update(clientData)
          .eq('id', formData.id)
          .select();
          
        if (error) {
          console.error('ClientForm - Erro ao atualizar:', error);
          throw error;
        }
        
        console.log('ClientForm - Cliente atualizado com sucesso:', updateData);
        toast.success("Cliente atualizado com sucesso");
      }
      
      onClose(true);
    } catch (error: any) {
      console.error("ClientForm - Erro ao salvar cliente:", error);
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
