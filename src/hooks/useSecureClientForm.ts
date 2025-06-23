
import { useState, useCallback } from 'react';
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

  const validateAndSanitizeClientData = useCallback((data: SecureClientFormData): SecureClientFormData => {
    try {
      // Sanitize all string fields
      const sanitizedData = InputSanitizer.sanitizeFormData(data);
      
      // Additional validation for required fields
      if (!sanitizedData.name?.trim()) {
        throw new Error('Nome/Razão Social é obrigatório');
      }
      
      if (sanitizedData.type === 'PJ') {
        if (!sanitizedData.cnpj?.trim()) {
          throw new Error('CNPJ é obrigatório para Pessoa Jurídica');
        }
        // Add CNPJ validation here if needed
      }
      
      if (sanitizedData.type === 'PF') {
        if (!sanitizedData.cpf?.trim()) {
          throw new Error('CPF é obrigatório para Pessoa Física');
        }
        // Add CPF validation here if needed
      }
      
      return sanitizedData;
    } catch (error) {
      throw new Error(`Dados inválidos: ${error.message}`);
    }
  }, []);

  const submitSecureClient = useCallback(async (
    data: SecureClientFormData, 
    isUpdate: boolean = false, 
    clientId?: string
  ) => {
    setIsSubmitting(true);
    
    try {
      // Validate and sanitize input data
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

  return {
    submitSecureClient,
    isSubmitting,
    validateAndSanitizeClientData,
  };
};
