
import { useState, useEffect } from 'react';
import { useToast } from "@/hooks/use-toast";
import { useAuth } from '@/components/Auth/AuthProvider';
import { UnifiedUser } from '@/hooks/useUnifiedUserManagement';
import { EditUserFormData, EditUserFormValidationErrors } from './types';
import { submitUserForm } from './formSubmission';
import { validateEditUserForm } from './validation';

interface UseEditUserFormProps {
  user: UnifiedUser | null;
  onSuccess: () => void;
  setOpen: (open: boolean) => void;
}

export const useEditUserForm = ({ user, onSuccess, setOpen }: UseEditUserFormProps) => {
  const { toast } = useToast();
  const { companyInfo } = useAuth();
  const [loading, setLoading] = useState(false);
  const [validationErrors, setValidationErrors] = useState<EditUserFormValidationErrors>({});
  
  const [form, setForm] = useState<EditUserFormData>({
    firstName: '',
    lastName: '',
    email: '',
    department: '',
    position: '',
    role: 'user',
    profileId: '',
    isActive: true,
  });

  // Carregar dados do usuário quando o modal abrir
  useEffect(() => {
    if (user) {
      setForm({
        firstName: user.first_name || '',
        lastName: user.last_name || '',
        email: user.email || '',
        department: user.department || '',
        position: user.position || '',
        role: user.role || 'user',
        profileId: user.profile_id || '',
        isActive: user.is_active ?? true,
      });
    }
  }, [user]);

  const handleFieldChange = (field: string, value: string | boolean) => {
    setForm(prev => ({ ...prev, [field]: value }));
    // Limpar erro do campo quando o usuário começar a digitar
    if (validationErrors[field as keyof EditUserFormValidationErrors]) {
      setValidationErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const handleSubmit = async () => {
    if (!user) return;

    const errors = validateEditUserForm(form);
    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      return;
    }

    setLoading(true);
    try {
      const success = await submitUserForm(user, form, companyInfo?.id, toast);
      if (success) {
        setOpen(false);
        onSuccess();
      }
    } catch (error) {
      console.error('Erro ao salvar usuário:', error);
    } finally {
      setLoading(false);
    }
  };

  return {
    form,
    validationErrors,
    loading,
    handleFieldChange,
    handleSubmit,
  };
};
