
import { useState } from 'react';
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { createUserSchema, type CreateUserData } from '@/lib/userValidation';
import { useAuth } from '@/components/Auth/AuthProvider';

interface UseCreateUserFormProps {
  onSuccess: () => void;
  setOpen: (open: boolean) => void;
  userRole: string;
}

export interface CreateUserFormState {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  profileId: string;
  role: string;
  department: string;
  position: string;
}

export interface CreateUserFormValidationErrors {
  firstName?: string;
  lastName?: string;
  email?: string;
  password?: string;
  profileId?: string;
  role?: string;
  department?: string;
  position?: string;
  general?: string;
}

export const useCreateUserForm = ({ onSuccess, setOpen, userRole }: UseCreateUserFormProps) => {
  const { toast } = useToast();
  const { companyInfo } = useAuth();
  const [loading, setLoading] = useState(false);
  const [validationErrors, setValidationErrors] = useState<CreateUserFormValidationErrors>({});

  const [form, setForm] = useState<CreateUserFormState>({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    profileId: '',
    role: 'user',
    department: '',
    position: '',
  });

  const validateForm = (): boolean => {
    try {
      // Limpar erros anteriores
      setValidationErrors({});
      
      // Validar com Zod
      createUserSchema.parse(form);
      
      // Validações adicionais específicas do contexto
      if (!companyInfo?.id) {
        setValidationErrors({ general: 'Informações da empresa não disponíveis' });
        return false;
      }

      if (userRole !== 'master' && form.role === 'master') {
        setValidationErrors({ role: 'Apenas usuários master podem criar outros masters' });
        return false;
      }

      return true;
    } catch (error: any) {
      const errors: CreateUserFormValidationErrors = {};
      
      if (error.errors) {
        error.errors.forEach((err: any) => {
          const field = err.path[0];
          errors[field as keyof CreateUserFormValidationErrors] = err.message;
        });
      }
      
      setValidationErrors(errors);
      return false;
    }
  };

  const handleChange = (field: keyof CreateUserFormState, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }));
    
    // Limpar erro do campo quando usuário começar a digitar
    if (validationErrors[field]) {
      setValidationErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase.functions.invoke('create-user', {
        body: {
          email: form.email,
          password: form.password,
          firstName: form.firstName,
          lastName: form.lastName,
          role: form.role,
          profileId: form.profileId || null,
          department: form.department || null,
          position: form.position || null,
          companyId: companyInfo?.id,
        },
        headers: {
          'x-requester-role': userRole,
        },
      });

      if (error) {
        console.error('Erro na função create-user:', error);
        
        // Mapear erros específicos
        if (error.message?.includes('email')) {
          setValidationErrors({ email: 'Este email já está em uso' });
        } else {
          setValidationErrors({ general: error.message || 'Erro ao criar usuário' });
        }
        return;
      }

      toast({
        title: "Sucesso",
        description: "Usuário criado com sucesso!",
      });

      // Resetar formulário
      setForm({
        firstName: '',
        lastName: '',
        email: '',
        password: '',
        profileId: '',
        role: 'user',
        department: '',
        position: '',
      });

      onSuccess();
      setOpen(false);
    } catch (error: any) {
      console.error('Erro inesperado ao criar usuário:', error);
      setValidationErrors({ general: 'Erro inesperado ao criar usuário' });
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
