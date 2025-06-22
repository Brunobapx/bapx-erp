
import { useState, useEffect } from 'react';
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { SimpleUser } from '@/hooks/useSimpleUserManagement';
import { editUserSchema, type EditUserData, sanitizeTextInput } from '@/lib/userValidation';

interface UseEditUserFormProps {
  user: SimpleUser | null;
  userRole: string;
  onSuccess: () => void;
  onClose: () => void;
}

interface EditUserFormData {
  first_name: string;
  last_name: string;
  email: string;
  department: string;
  position: string;
  role: string;
  profile_id: string;
  new_password: string;
}

interface EditUserValidationErrors {
  first_name?: string;
  last_name?: string;
  department?: string;
  position?: string;
  role?: string;
  profile_id?: string;
  new_password?: string;
  general?: string;
}

export const useEditUserForm = ({ user, userRole, onSuccess, onClose }: UseEditUserFormProps) => {
  const [loading, setLoading] = useState(false);
  const [validationErrors, setValidationErrors] = useState<EditUserValidationErrors>({});
  const [formData, setFormData] = useState<EditUserFormData>({
    first_name: '',
    last_name: '',
    email: '',
    department: '',
    position: '',
    role: 'user',
    profile_id: '',
    new_password: ''
  });
  const { toast } = useToast();

  useEffect(() => {
    if (user) {
      setFormData({
        first_name: user.first_name || '',
        last_name: user.last_name || '',
        email: user.email || '',
        department: user.department || '',
        position: user.position || '',
        role: user.role || 'user',
        profile_id: user.profile_id || '',
        new_password: ''
      });
      setValidationErrors({});
    }
  }, [user]);

  const canManageUser = (targetUser: SimpleUser) => {
    if (userRole === 'master') return true;
    if (userRole === 'admin' && targetUser.role !== 'master') return true;
    return false;
  };

  const validateForm = (): boolean => {
    try {
      setValidationErrors({});
      
      const validationData = {
        firstName: formData.first_name,
        lastName: formData.last_name,
        email: formData.email,
        profileId: formData.profile_id,
        role: formData.role,
        department: formData.department,
        position: formData.position,
        newPassword: formData.new_password
      };

      editUserSchema.parse(validationData);

      // Validações específicas de contexto
      if (userRole !== 'master' && formData.role === 'master') {
        setValidationErrors({ role: 'Apenas usuários master podem atribuir o papel master' });
        return false;
      }

      return true;
    } catch (error: any) {
      const errors: EditUserValidationErrors = {};
      
      if (error.errors) {
        error.errors.forEach((err: any) => {
          const field = err.path[0];
          // Mapear nomes dos campos
          const fieldMap: Record<string, keyof EditUserValidationErrors> = {
            firstName: 'first_name',
            lastName: 'last_name',
            profileId: 'profile_id',
            newPassword: 'new_password'
          };
          
          const mappedField = fieldMap[field] || field;
          errors[mappedField as keyof EditUserValidationErrors] = err.message;
        });
      }
      
      setValidationErrors(errors);
      return false;
    }
  };

  const handleFormDataChange = (field: keyof EditUserFormData, value: string) => {
    // Sanitizar entrada de texto
    const sanitizedValue = ['department', 'position'].includes(field) 
      ? sanitizeTextInput(value) 
      : value;
    
    setFormData(prev => ({ ...prev, [field]: sanitizedValue }));
    
    // Limpar erro do campo
    if (validationErrors[field]) {
      setValidationErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    if (!canManageUser(user)) {
      setValidationErrors({
        general: "Você não tem permissão para editar este usuário"
      });
      return;
    }

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      // Atualizar dados do perfil
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          first_name: formData.first_name,
          last_name: formData.last_name,
          department: formData.department,
          position: formData.position,
          profile_id: formData.profile_id || null,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id);

      if (profileError) throw profileError;

      // Atualizar role se mudou
      if (formData.role !== user.role) {
        const { error: roleError } = await supabase
          .from('user_roles')
          .update({ role: formData.role })
          .eq('user_id', user.id);

        if (roleError) throw roleError;
      }

      // Atualizar senha se fornecida
      if (formData.new_password.trim()) {
        const { error: functionError } = await supabase.functions.invoke('update-user-password', {
          body: { 
            userId: user.id, 
            newPassword: formData.new_password 
          },
          headers: {
            'x-requester-role': userRole,
          },
        });

        if (functionError) {
          console.warn('Não foi possível atualizar a senha:', functionError);
          toast({
            title: "Aviso",
            description: "Usuário atualizado, mas não foi possível alterar a senha.",
            variant: "default",
          });
        }
      }

      toast({
        title: "Sucesso",
        description: "Usuário atualizado com sucesso!",
      });

      onSuccess();
      onClose();
    } catch (error: any) {
      console.error('Erro ao atualizar usuário:', error);
      setValidationErrors({
        general: error.message || "Erro ao atualizar usuário"
      });
    } finally {
      setLoading(false);
    }
  };

  return {
    formData,
    loading,
    validationErrors,
    canManageUser,
    handleFormDataChange,
    handleSubmit,
  };
};
