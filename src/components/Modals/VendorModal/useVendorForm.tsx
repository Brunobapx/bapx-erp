
import { useState, useEffect } from 'react';
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

import { buildVendorData } from "./buildVendorData";
import { validateVendorForm } from "./useVendorFormValidation";

interface FormData {
  id?: string;
  name: string;
  cnpj: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  contact_person: string;
  notes: string;
}

export const useVendorForm = (vendorData: any | null, onClose: (refresh?: boolean) => void) => {
  const [formData, setFormData] = useState<FormData>({
    name: '',
    cnpj: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    zip: '',
    contact_person: '',
    notes: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  

  const isNewVendor = !vendorData?.id;

  useEffect(() => {
    if (vendorData) {
      setFormData({
        name: vendorData.name || '',
        cnpj: vendorData.cnpj || '',
        email: vendorData.email || '',
        phone: vendorData.phone || '',
        address: vendorData.address || '',
        city: vendorData.city || '',
        state: vendorData.state || '',
        zip: vendorData.zip || '',
        contact_person: vendorData.contact_person || '',
        notes: vendorData.notes || ''
      });
    } else {
      resetForm();
    }
  }, [vendorData]);

  const resetForm = () => {
    setFormData({
      name: '',
      cnpj: '',
      email: '',
      phone: '',
      address: '',
      city: '',
      state: '',
      zip: '',
      contact_person: '',
      notes: ''
    });
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    if (!validateVendorForm(formData)) return;

    try {
      setIsSubmitting(true);
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        toast.error("Usuário não autenticado. Faça login para continuar.");
        return;
      }

      const vendorDataObj = buildVendorData(formData, user.id);

      if (isNewVendor) {
        const { error } = await supabase
          .from('vendors')
          .insert([vendorDataObj])
          .select();
        if (error) throw error;
        toast.success("Fornecedor cadastrado com sucesso!");
      } else {
        const { error } = await supabase
          .from('vendors')
          .update(vendorDataObj)
          .eq('id', vendorData.id)
          .select();
        if (error) throw error;
        toast.success("Fornecedor atualizado com sucesso!");
      }
      onClose(true);
    } catch (error: any) {
      toast.error(`Erro ao ${isNewVendor ? 'adicionar' : 'atualizar'} fornecedor: ${error?.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    formData,
    isSubmitting,
    isNewVendor,
    handleChange,
    handleSubmit,
    resetForm
  };
};
