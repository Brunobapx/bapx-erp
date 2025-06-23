
import { useState, useCallback, useMemo } from 'react';
import { InputSanitizer } from '@/lib/security/inputSanitizer';
import { useClients } from '@/hooks/useClients';
import { toast } from 'sonner';

export interface SecureClientFormData {
  name: string;
  type: 'PF' | 'PJ';
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
  bairro?: string;
  number?: string;
  complement?: string;
}

export const useSecureClientForm = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { createClient, updateClient } = useClients();

  // Memoized validation function
  const validateAndSanitizeClientData = useCallback((data: SecureClientFormData): SecureClientFormData => {
    try {
      const sanitizedData = InputSanitizer.sanitizeFormData(data);
      
      if (!sanitizedData.name?.trim()) {
        throw new Error('Nome/Razão Social é obrigatório');
      }
      
      if (sanitizedData.type === 'PJ') {
        if (!sanitizedData.cnpj?.trim()) {
          throw new Error('CNPJ é obrigatório para Pessoa Jurídica');
        }
      }
      
      if (sanitizedData.type === 'PF') {
        if (!sanitizedData.cpf?.trim()) {
          throw new Error('CPF é obrigatório para Pessoa Física');
        }
      }
      
      return sanitizedData;
    } catch (error) {
      throw new Error(`Dados inválidos: ${error.message}`);
    }
  }, []);

  // Memoized submit function
  const submitSecureClient = useCallback(async (
    data: SecureClientFormData, 
    isUpdate: boolean = false, 
    clientId?: string
  ) => {
    setIsSubmitting(true);
    
    try {
      const sanitizedData = validateAndSanitizeClientData(data);
      
      if (isUpdate && clientId) {
        await updateClient(clientId, sanitizedData);
        toast.success('Cliente atualizado com sucesso!');
      } else {
        await createClient(sanitizedData);
        toast.success('Cliente criado com sucesso!');
      }
      
      return { success: true };
    } catch (error: any) {
      console.error('[SecureClientForm] Error:', error);
      toast.error(error.message || 'Erro ao processar dados do cliente');
      return { success: false, error: error.message };
    } finally {
      setIsSubmitting(false);
    }
  }, [validateAndSanitizeClientData, createClient, updateClient]);

  // Memoized return object
  return useMemo(() => ({
    submitSecureClient,
    isSubmitting,
    validateAndSanitizeClientData,
  }), [submitSecureClient, isSubmitting, validateAndSanitizeClientData]);
};
