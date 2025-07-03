import { useState } from 'react';
import { useToast } from "@/hooks/use-toast";
import { useSimpleUserCreate, type SimpleCreateUserData, type SimpleCreateUserErrors } from '@/hooks/useSimpleUserCreate';
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
  const { createUser, loading } = useSimpleUserCreate();
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

  const handleChange = (field: keyof CreateUserFormState, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }));
    
    // Limpar erro do campo quando usuário começar a digitar
    if (validationErrors[field]) {
      setValidationErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const handleSubmit = async () => {
    console.log('=== NOVO SISTEMA DE CRIAÇÃO DE USUÁRIO ===');
    
    // Limpar erros anteriores
    setValidationErrors({});

    // Validação específica de roles
    if (userRole !== 'master' && form.role === 'master') {
      setValidationErrors({ role: 'Apenas usuários master podem criar outros masters' });
      return;
    }

    // Preparar dados para o novo sistema
    const userData: SimpleCreateUserData = {
      firstName: form.firstName,
      lastName: form.lastName,
      email: form.email,
      password: form.password,
      profileId: form.profileId || undefined,
      role: form.role,
      department: form.department || undefined,
      position: form.position || undefined,
    };

    console.log('Dados do usuário:', userData);

    const result = await createUser(userData);

    if (result.success) {
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
    } else if (result.errors) {
      // Mapear erros do novo sistema para o formato antigo
      const mappedErrors: CreateUserFormValidationErrors = {};
      
      if (result.errors.firstName) mappedErrors.firstName = result.errors.firstName;
      if (result.errors.lastName) mappedErrors.lastName = result.errors.lastName;
      if (result.errors.email) mappedErrors.email = result.errors.email;
      if (result.errors.password) mappedErrors.password = result.errors.password;
      if (result.errors.profileId) mappedErrors.profileId = result.errors.profileId;
      if (result.errors.role) mappedErrors.role = result.errors.role;
      if (result.errors.department) mappedErrors.department = result.errors.department;
      if (result.errors.position) mappedErrors.position = result.errors.position;
      if (result.errors.general) mappedErrors.general = result.errors.general;

      setValidationErrors(mappedErrors);
      
      // Mostrar toast apenas para erros gerais
      if (result.errors.general) {
        toast({
          title: "Erro",
          description: result.errors.general,
          variant: "destructive",
        });
      }
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