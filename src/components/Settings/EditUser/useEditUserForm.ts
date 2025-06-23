
import { useState, useEffect } from 'react';
import { useToast } from "@/hooks/use-toast";
import { SimpleUser } from '@/types/user';
import { EditUserFormData, EditUserValidationErrors, UseEditUserFormProps } from './types';
import { initializeFormData, sanitizeFormField } from './formUtils';
import { validateEditUserForm } from './validation';
import { canManageUser } from './permissions';
import { submitUserUpdate } from './formSubmission';

export const useEditUserForm = ({ user, userRole, onSuccess, onClose }: UseEditUserFormProps) => {
  const [loading, setLoading] = useState(false);
  const [validationErrors, setValidationErrors] = useState<EditUserValidationErrors>({});
  const [formData, setFormData] = useState<EditUserFormData>(initializeFormData(null));
  const { toast } = useToast();

  useEffect(() => {
    if (user) {
      setFormData(initializeFormData(user));
      setValidationErrors({});
    }
  }, [user]);

  const handleFormDataChange = (field: keyof EditUserFormData, value: string) => {
    const sanitizedValue = sanitizeFormField(field, value);
    
    setFormData(prev => ({ ...prev, [field]: sanitizedValue }));
    
    // Limpar erro do campo
    if (validationErrors[field]) {
      setValidationErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    if (!canManageUser(userRole, user)) {
      setValidationErrors({
        general: "Você não tem permissão para editar este usuário"
      });
      return;
    }

    const validation = validateEditUserForm(formData, userRole);
    if (!validation.isValid) {
      setValidationErrors(validation.errors);
      return;
    }

    setLoading(true);

    try {
      const result = await submitUserUpdate(user, formData, userRole);
      
      if (result.success) {
        toast({
          title: "Sucesso",
          description: "Usuário atualizado com sucesso!",
        });
        onSuccess();
        onClose();
      } else {
        setValidationErrors(result.errors || {});
      }
    } catch (error: any) {
      console.error('Erro ao atualizar usuário:', error);
      setValidationErrors({
        general: error.message || "Erro ao atualizar usuário"
      });
    } finally {
      setLoading(false);
    }
  };

  return {
    formData,
    loading,
    validationErrors,
    canManageUser: user ? canManageUser(userRole, user) : false,
    handleFormDataChange,
    handleSubmit,
  };
};
