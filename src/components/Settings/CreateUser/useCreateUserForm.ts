
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
      
      // Validações básicas obrigatórias
      const errors: CreateUserFormValidationErrors = {};
      
      if (!form.firstName.trim()) {
        errors.firstName = 'Nome é obrigatório';
      }
      
      if (!form.lastName.trim()) {
        errors.lastName = 'Sobrenome é obrigatório';
      }
      
      if (!form.email.trim()) {
        errors.email = 'Email é obrigatório';
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
        errors.email = 'Email inválido';
      }
      
      if (!form.password) {
        errors.password = 'Senha é obrigatória';
      } else if (form.password.length < 8) {
        errors.password = 'Senha deve ter pelo menos 8 caracteres';
      }
      
      if (!form.profileId) {
        errors.profileId = 'Perfil de acesso é obrigatório';
      }
      
      // Validações adicionais específicas do contexto
      if (!companyInfo?.id) {
        errors.general = 'Informações da empresa não disponíveis';
      }

      if (userRole !== 'master' && form.role === 'master') {
        errors.role = 'Apenas usuários master podem criar outros masters';
      }

      if (Object.keys(errors).length > 0) {
        setValidationErrors(errors);
        return false;
      }

      return true;
    } catch (error: any) {
      console.error('Validation error:', error);
      setValidationErrors({ general: 'Erro na validação dos dados' });
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
      console.log('Submitting user creation form:', {
        email: form.email,
        firstName: form.firstName,
        lastName: form.lastName,
        role: form.role,
        profileId: form.profileId,
        companyId: companyInfo?.id
      });

      const { data, error } = await supabase.functions.invoke('create-user', {
        body: {
          email: form.email.trim().toLowerCase(),
          password: form.password,
          firstName: form.firstName.trim(),
          lastName: form.lastName.trim(),
          role: form.role,
          profileId: form.profileId,
          department: form.department?.trim() || null,
          position: form.position?.trim() || null,
          companyId: companyInfo?.id,
        },
        headers: {
          'x-requester-role': userRole,
          'Content-Type': 'application/json',
        },
      });

      if (error) {
        console.error('Erro na função create-user:', error);
        
        // Mapear diferentes tipos de erro com mensagens mais específicas
        let errorMessage = 'Erro ao criar usuário';
        
        if (error.message?.includes('User already registered') || 
            error.message?.includes('email_exists') ||
            error.message?.includes('A user with this email address has already been registered')) {
          setValidationErrors({ email: 'Este email já está cadastrado no sistema' });
          return;
        } else if (error.message?.includes('Permission denied') || 
                   error.message?.includes('Permissão negada') ||
                   error.message?.includes('admin/master')) {
          errorMessage = 'Você não tem permissão para criar usuários';
        } else if (error.message?.includes('duplicate key value violates unique constraint')) {
          errorMessage = 'Usuário já possui esta função no sistema';
        } else if (error.message?.includes('Company ID não disponível')) {
          errorMessage = 'Informações da empresa não encontradas. Tente fazer login novamente.';
        } else if (error.message) {
          errorMessage = error.message;
        }
        
        setValidationErrors({ general: errorMessage });
        
        toast({
          title: "Erro",
          description: errorMessage,
          variant: "destructive",
        });
        return;
      }

      console.log('User created successfully:', data);

      toast({
        title: "Sucesso",
        description: `Usuário ${form.firstName} ${form.lastName} criado com sucesso!`,
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
      
      // Tratamento específico para diferentes tipos de erro
      let errorMessage = 'Erro inesperado ao criar usuário';
      
      if (error.message?.includes('Edge Function returned a non-2xx status code')) {
        errorMessage = 'Erro no servidor. Verifique sua conexão e tente novamente.';
      } else if (error.message?.includes('network')) {
        errorMessage = 'Erro de conexão. Verifique sua internet e tente novamente.';
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      setValidationErrors({ general: errorMessage });
      
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
