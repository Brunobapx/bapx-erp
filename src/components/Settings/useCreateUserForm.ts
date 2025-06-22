
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { validateAndSanitizeUser } from '@/lib/validation';

export interface CreateUserFormState {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  profileId: string;
}

export interface CreateUserFormValidationErrors {
  email?: string;
  password?: string;
  firstName?: string;
  lastName?: string;
  profileId?: string;
  general?: string;
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
    firstName: '',
    lastName: '',
    profileId: '',
  });
  
  const [validationErrors, setValidationErrors] = useState<CreateUserFormValidationErrors>({});
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleChange = (field: keyof CreateUserFormState, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }));
    if (validationErrors[field]) {
      setValidationErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const handleSubmit = async () => {
    setValidationErrors({});
    
    try {
      // Valida e sanitiza os dados
      const validatedData = validateAndSanitizeUser(form);
      
      setLoading(true);

      // Get current user's company
      const { data: currentUser, error: userError } = await supabase
        .from('profiles')
        .select('company_id')
        .eq('id', (await supabase.auth.getUser()).data.user?.id)
        .single();

      if (userError || !currentUser) {
        throw new Error('Erro ao obter informações do usuário atual');
      }

      // Call edge function to create user
      const { data, error } = await supabase.functions.invoke('create-user', {
        body: {
          email: validatedData.email,
          password: validatedData.password,
          firstName: validatedData.firstName,
          lastName: validatedData.lastName,
          profile_id: validatedData.profileId,
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

      setForm({
        email: '',
        password: '',
        firstName: '',
        lastName: '',
        profileId: '',
      });
      
      setOpen(false);
      onSuccess();
    } catch (error: any) {
      console.error('Erro ao criar usuário:', error);
      
      if (error.name === 'ZodError') {
        // Erros de validação
        const fieldErrors: CreateUserFormValidationErrors = {};
        error.errors.forEach((err: any) => {
          if (err.path.length > 0) {
            fieldErrors[err.path[0] as keyof CreateUserFormValidationErrors] = err.message;
          }
        });
        setValidationErrors(fieldErrors);
      } else {
        // Outros erros
        let errorMessage = 'Erro ao criar usuário';
        if (error.message?.includes('User already registered')) {
          errorMessage = 'Este email já está cadastrado no sistema';
        } else if (error.message?.includes('Permission denied')) {
          errorMessage = 'Você não tem permissão para criar usuários';
        } else if (error.message) {
          errorMessage = error.message;
        }

        setValidationErrors({ general: errorMessage });
        toast({
          title: "Erro",
          description: errorMessage,
          variant: "destructive",
        });
      }
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
