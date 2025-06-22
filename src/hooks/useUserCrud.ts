
import { useState } from 'react';
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from '@/components/Auth/AuthProvider';
import { createUserSchema, editUserSchema, sanitizeTextInput } from '@/lib/userValidation';

export interface CreateUserData {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  profileId: string;
  role: string;
  department?: string;
  position?: string;
}

export interface UpdateUserData {
  first_name: string;
  last_name: string;
  department?: string;
  position?: string;
  role?: string;
  profile_id?: string;
  new_password?: string;
}

export const useUserCrud = () => {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const { companyInfo, userRole } = useAuth();

  const createUser = async (userData: CreateUserData) => {
    setLoading(true);
    try {
      // Validar dados com Zod
      const validatedData = createUserSchema.parse({
        firstName: sanitizeTextInput(userData.firstName),
        lastName: sanitizeTextInput(userData.lastName),
        email: userData.email.toLowerCase().trim(),
        password: userData.password,
        profileId: userData.profileId,
        role: userData.role,
        department: userData.department ? sanitizeTextInput(userData.department) : undefined,
        position: userData.position ? sanitizeTextInput(userData.position) : undefined,
      });

      const { error } = await supabase.functions.invoke('create-user', {
        body: {
          email: validatedData.email,
          password: validatedData.password,
          firstName: validatedData.firstName,
          lastName: validatedData.lastName,
          role: validatedData.role,
          profileId: validatedData.profileId || null,
          department: validatedData.department || null,
          position: validatedData.position || null,
          companyId: companyInfo?.id,
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

      return { success: true };
    } catch (error: any) {
      console.error('Erro ao criar usuário:', error);
      toast({
        title: "Erro",
        description: error.message || "Erro ao criar usuário",
        variant: "destructive",
      });
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  };

  const updateUser = async (userId: string, userData: UpdateUserData) => {
    setLoading(true);
    try {
      // Validar dados com Zod
      const validatedData = editUserSchema.parse({
        firstName: sanitizeTextInput(userData.first_name),
        lastName: sanitizeTextInput(userData.last_name),
        email: '', // Não alteramos email na edição
        profileId: userData.profile_id || '',
        role: userData.role || 'user',
        department: userData.department ? sanitizeTextInput(userData.department) : undefined,
        position: userData.position ? sanitizeTextInput(userData.position) : undefined,
        newPassword: userData.new_password || '',
      });

      // Atualizar dados do perfil
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          first_name: validatedData.firstName,
          last_name: validatedData.lastName,
          department: validatedData.department,
          position: validatedData.position,
          profile_id: validatedData.profileId || null,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId);

      if (profileError) throw profileError;

      // Atualizar role se fornecida
      if (userData.role) {
        const { error: roleError } = await supabase
          .from('user_roles')
          .update({ role: userData.role })
          .eq('user_id', userId);

        if (roleError) throw roleError;
      }

      // Atualizar senha se fornecida
      if (userData.new_password?.trim()) {
        const { error: passwordError } = await supabase.functions.invoke('update-user-password', {
          body: { 
            userId, 
            newPassword: userData.new_password 
          },
          headers: {
            'x-requester-role': userRole,
          },
        });

        if (passwordError) {
          console.warn('Não foi possível atualizar a senha:', passwordError);
        }
      }

      toast({
        title: "Sucesso",
        description: "Usuário atualizado com sucesso!",
      });

      return { success: true };
    } catch (error: any) {
      console.error('Erro ao atualizar usuário:', error);
      toast({
        title: "Erro",
        description: error.message || "Erro ao atualizar usuário",
        variant: "destructive",
      });
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  };

  const updateUserStatus = async (userId: string, isActive: boolean) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ is_active: isActive })
        .eq('id', userId);
        
      if (error) throw error;
      
      toast({
        title: "Sucesso",
        description: `Usuário ${isActive ? 'ativado' : 'desativado'} com sucesso!`,
      });
      
      return { success: true };
    } catch (error: any) {
      console.error('Error updating user status:', error);
      toast({ 
        title: "Erro", 
        description: "Erro ao atualizar status do usuário", 
        variant: "destructive" 
      });
      return { success: false, error: error.message };
    }
  };

  const deleteUser = async (userId: string) => {
    setLoading(true);
    try {
      const { error } = await supabase.functions.invoke('delete-user', {
        body: { userId },
        headers: {
          'x-requester-role': userRole,
        },
      });

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Usuário excluído com sucesso!",
      });

      return { success: true };
    } catch (error: any) {
      console.error('Erro ao excluir usuário:', error);
      toast({
        title: "Erro",
        description: error.message || "Erro ao excluir usuário",
        variant: "destructive",
      });
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  };

  return {
    createUser,
    updateUser,
    updateUserStatus,
    deleteUser,
    loading,
  };
};
