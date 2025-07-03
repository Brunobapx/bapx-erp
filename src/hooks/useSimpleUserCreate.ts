import { useState } from 'react';
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from '@/components/Auth/AuthProvider';

export interface SimpleCreateUserData {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  profileId?: string;
  role: string;
  department?: string;
  position?: string;
}

export interface SimpleCreateUserErrors {
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

export const useSimpleUserCreate = () => {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const { companyInfo } = useAuth();

  const validateForm = (data: SimpleCreateUserData): SimpleCreateUserErrors => {
    const errors: SimpleCreateUserErrors = {};

    if (!data.firstName.trim()) {
      errors.firstName = 'Nome é obrigatório';
    }

    if (!data.lastName.trim()) {
      errors.lastName = 'Sobrenome é obrigatório';
    }

    if (!data.email.trim()) {
      errors.email = 'Email é obrigatório';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
      errors.email = 'Email inválido';
    }

    if (!data.password) {
      errors.password = 'Senha é obrigatória';
    } else if (data.password.length < 8) {
      errors.password = 'Senha deve ter pelo menos 8 caracteres';
    }

    if (!data.role) {
      errors.role = 'Papel é obrigatório';
    }

    if (!companyInfo?.id) {
      errors.general = 'Informações da empresa não disponíveis';
    }

    return errors;
  };

  const createUser = async (data: SimpleCreateUserData): Promise<{ success: boolean; errors?: SimpleCreateUserErrors }> => {
    setLoading(true);
    console.log('=== INICIANDO CRIAÇÃO SIMPLIFICADA DE USUÁRIO ===');

    try {
      // Validar dados
      const errors = validateForm(data);
      if (Object.keys(errors).length > 0) {
        console.log('Erros de validação:', errors);
        return { success: false, errors };
      }

      console.log('Criando usuário com email:', data.email);

      // Usar API admin do Supabase para criar usuário
      const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
        email: data.email,
        password: data.password,
        email_confirm: true, // Confirmar email automaticamente
        user_metadata: {
          first_name: data.firstName,
          last_name: data.lastName,
        }
      });

      if (createError) {
        console.error('Erro ao criar usuário:', createError);
        
        let errorMessage = 'Erro ao criar usuário';
        if (createError.message?.includes('User already registered') || 
            createError.message?.includes('already been registered')) {
          return { 
            success: false, 
            errors: { email: 'Este email já está cadastrado no sistema' } 
          };
        }
        
        return { 
          success: false, 
          errors: { general: createError.message || errorMessage } 
        };
      }

      if (!newUser.user) {
        console.error('Usuário criado mas não retornado');
        return { 
          success: false, 
          errors: { general: 'Erro ao criar usuário - dados não retornados' } 
        };
      }

      console.log('Usuário criado com sucesso:', newUser.user.id);

      // Criar perfil do usuário
      const { error: profileError } = await supabase
        .from('profiles')
        .insert({
          id: newUser.user.id,
          first_name: data.firstName,
          last_name: data.lastName,
          company_id: companyInfo!.id,
          profile_id: data.profileId || null,
          department: data.department || null,
          position: data.position || null,
          is_active: true
        });

      if (profileError) {
        console.error('Erro ao criar perfil:', profileError);
        
        // Tentar deletar o usuário criado no auth
        await supabase.auth.admin.deleteUser(newUser.user.id);
        
        return { 
          success: false, 
          errors: { general: 'Erro ao criar perfil do usuário' } 
        };
      }

      // Criar role do usuário
      const { error: roleError } = await supabase
        .from('user_roles')
        .insert({
          user_id: newUser.user.id,
          role: data.role as any,
          company_id: companyInfo!.id
        });

      if (roleError) {
        console.error('Erro ao criar role:', roleError);
        
        // Tentar deletar o usuário e perfil criados
        await supabase.auth.admin.deleteUser(newUser.user.id);
        await supabase.from('profiles').delete().eq('id', newUser.user.id);
        
        return { 
          success: false, 
          errors: { general: 'Erro ao definir função do usuário' } 
        };
      }

      console.log('Usuário criado com sucesso completo');

      toast({
        title: "Sucesso",
        description: `Usuário ${data.firstName} ${data.lastName} criado com sucesso!`,
      });

      return { success: true };

    } catch (error: any) {
      console.error('Erro inesperado:', error);
      
      return { 
        success: false, 
        errors: { general: error.message || 'Erro inesperado ao criar usuário' } 
      };
    } finally {
      setLoading(false);
    }
  };

  return {
    createUser,
    loading
  };
};