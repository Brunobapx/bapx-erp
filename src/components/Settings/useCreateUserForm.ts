
import { useState } from 'react';
import { z } from 'zod';
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

const emailSchema = z.string().email('Email inválido');
const passwordSchema = z.string().min(6, 'Senha deve ter pelo menos 6 caracteres');

export interface CreateUserFormState {
  email: string;
  password: string;
  role: string;
}
export interface CreateUserFormValidationErrors {
  email?: string;
  password?: string;
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
    role: 'user',
  });
  const [validationErrors, setValidationErrors] = useState<CreateUserFormValidationErrors>({});
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const validate = () => {
    const errors: CreateUserFormValidationErrors = {};
    try {
      emailSchema.parse(form.email);
    } catch (err) {
      if (err instanceof z.ZodError) errors.email = err.errors[0]?.message;
    }
    try {
      passwordSchema.parse(form.password);
    } catch (err) {
      if (err instanceof z.ZodError) errors.password = err.errors[0]?.message;
    }
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleChange = (field: keyof CreateUserFormState, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }));
    setValidationErrors(errors => ({ ...errors, [field]: undefined }));
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setLoading(true);

    try {
      // Obter o token de autenticação atual
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !session?.access_token) {
        throw new Error("Usuário não autenticado");
      }

      // Chamar Edge Function
      const { data, error } = await supabase.functions.invoke('create-user', {
        body: {
          email: form.email.trim(),
          password: form.password,
          role: form.role,
        },
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'x-requester-role': userRole
        }
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      if (!data?.success) throw new Error("Resposta inesperada do servidor");

      toast({
        title: "Sucesso",
        description: "Usuário criado e associado à empresa com sucesso!",
      });

      setForm({ email: '', password: '', role: 'user' });
      setOpen(false);
      onSuccess();

    } catch (err: any) {
      let errorMessage = "Erro desconhecido ao criar usuário";
      if (err.context?.json) {
        try {
          const errorBody = await err.context.json();
          errorMessage = errorBody.error || err.message;
        } catch {
          errorMessage = "Erro de comunicação. Não foi possível ler a resposta do servidor.";
        }
      } else if (err?.message) {
        errorMessage = err.message;
      } else if (typeof err === 'string') {
        errorMessage = err;
      }
      if (errorMessage.includes("Failed to send") || errorMessage.includes("fetch")) {
        errorMessage = "Erro de comunicação com o servidor. Verifique sua conexão e tente novamente.";
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
    setForm
  };
};
