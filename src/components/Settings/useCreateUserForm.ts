
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
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

  const handleChange = (field: keyof CreateUserFormState, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }));
    // Limpar erro específico quando o usuário começa a digitar
    if (validationErrors[field]) {
      setValidationErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const validateForm = (): boolean => {
    const errors: CreateUserFormValidationErrors = {};

    if (!form.email.trim()) {
      errors.email = 'Email é obrigatório';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      errors.email = 'Email inválido';
    }

    if (!form.password.trim()) {
      errors.password = 'Senha é obrigatória';
    } else if (form.password.length < 6) {
      errors.password = 'Senha deve ter pelo menos 6 caracteres';
    }

    if (!form.profile.trim()) {
      errors.profile = 'Perfil é obrigatório';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      // Buscar a empresa do usuário logado
      const { data: currentUser, error: userError } = await supabase
        .from('profiles')
        .select('company_id')
        .eq('id', (await supabase.auth.getUser()).data.user?.id)
        .single();

      if (userError || !currentUser) {
        throw new Error('Erro ao obter informações do usuário atual');
      }

      // Chamar a função serverless para criar o usuário
      const { data, error } = await supabase.functions.invoke('create-user', {
        body: {
          email: form.email.trim(),
          password: form.password,
          profile_id: form.profile,
          company_id: currentUser.company_id
        },
        headers: {
          'x-requester-role': userRole,
        },
      });

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Usuário criado com sucesso!",
      });

      // Resetar formulário
      setForm({
        email: '',
        password: '',
        profile: '',
      });
      
      setOpen(false);
      onSuccess();
    } catch (error: any) {
      console.error('Erro ao criar usuário:', error);
      
      let errorMessage = 'Erro ao criar usuário';
      if (error.message?.includes('User already registered')) {
        errorMessage = 'Este email já está cadastrado no sistema';
      } else if (error.message?.includes('Permission denied')) {
        errorMessage = 'Você não tem permissão para criar usuários';
      } else if (error.message) {
        errorMessage = error.message;
      }

      toast({
        title: "Erro",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return {
    form,
    handleChange,
    handleSubmit,
    validationErrors,
    loading,
  };
};
