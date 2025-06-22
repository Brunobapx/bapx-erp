
import { useState, useEffect } from 'react';
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { SimpleUser } from '@/hooks/useSimpleUserManagement';

interface UseEditUserFormProps {
  user: SimpleUser | null;
  userRole: string;
  onSuccess: () => void;
  onClose: () => void;
}

export const useEditUserForm = ({ user, userRole, onSuccess, onClose }: UseEditUserFormProps) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
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
    }
  }, [user]);

  const canManageUser = (targetUser: SimpleUser) => {
    if (userRole === 'master') return true;
    if (userRole === 'admin' && targetUser.role !== 'master') return true;
    return false;
  };

  const handleFormDataChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    if (!canManageUser(user)) {
      toast({
        title: "Erro",
        description: "Você não tem permissão para editar este usuário",
        variant: "destructive",
      });
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
      toast({
        title: "Erro",
        description: error.message || "Erro ao atualizar usuário",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return {
    formData,
    loading,
    canManageUser,
    handleFormDataChange,
    handleSubmit,
  };
};
