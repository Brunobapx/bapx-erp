
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/Auth/AuthProvider';
import { useToast } from '@/hooks/use-toast';

export interface CreateUserFormState {
  email: string;
  password: string;
  profile: string;
}

export interface CreateUserFormValidationErrors {
  email?: string;
  password?: string;
  profile?: string;
}

interface UseCreateUserFormProps {
  onSuccess: () => void;
  setOpen: (open: boolean) => void;
  userRole: string;
}

export const useCreateUserForm = ({ onSuccess, setOpen, userRole }: UseCreateUserFormProps) => {
  const [form, setForm] = useState<CreateUserFormState>({
    email: '',
    password: '',
    profile: '',
  });
  const [validationErrors, setValidationErrors] = useState<CreateUserFormValidationErrors>({});
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const { companyInfo } = useAuth();

  const validateForm = (): boolean => {
    const errors: CreateUserFormValidationErrors = {};

    if (!form.email) {
      errors.email = 'Email é obrigatório';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      errors.email = 'Email inválido';
    }

    if (!form.password) {
      errors.password = 'Senha é obrigatória';
    } else if (form.password.length < 6) {
      errors.password = 'Senha deve ter pelo menos 6 caracteres';
    }

    if (!form.profile) {
      errors.profile = 'Perfil é obrigatório';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleChange = (field: keyof CreateUserFormState, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }));
    // Limpar erro do campo quando o usuário começar a digitar
    if (validationErrors[field]) {
      setValidationErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;
    if (!companyInfo?.id) {
      toast({
        title: "Erro",
        description: "Informações da empresa não encontradas",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      // Chamar edge function para criar usuário
      const { data, error } = await supabase.functions.invoke('create-user', {
        body: {
          email: form.email,
          password: form.password,
          profile_id: form.profile,
          company_id: companyInfo.id,
        },
        headers: {
          'x-requester-role': userRole,
        },
      });

      if (error) throw error;

      onSuccess();
      setForm({ email: '', password: '', profile: '' });
    } catch (error: any) {
      console.error('Erro ao criar usuário:', error);
      toast({
        title: "Erro",
        description: error.message || "Erro ao criar usuário",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return {
    form,
    validationErrors,
    loading,
    handleChange,
    handleSubmit,
  };
};
