
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from '@/components/Auth/AuthProvider';
import { UnifiedUser } from '@/hooks/useUnifiedUserManagement';

interface FormData {
  firstName: string;
  lastName: string;
  email: string;
  department: string;
  position: string;
  role: string;
  profileId: string;
  isActive: boolean;
}

export const submitUserForm = async (
  user: UnifiedUser,
  formData: FormData,
  companyId: string | undefined,
  toast: ReturnType<typeof useToast>['toast']
): Promise<boolean> => {
  try {
    if (!companyId) {
      throw new Error('Company ID não disponível');
    }

    // Atualizar perfil do usuário
    const { error: profileError } = await supabase
      .from('profiles')
      .update({
        first_name: formData.firstName,
        last_name: formData.lastName,
        department: formData.department,
        position: formData.position,
        is_active: formData.isActive,
        profile_id: formData.profileId || null,
        updated_at: new Date().toISOString()
      })
      .eq('id', user.id);

    if (profileError) throw profileError;

    // Atualizar role do usuário
    const { error: roleError } = await supabase
      .from('user_roles')
      .upsert({
        user_id: user.id,
        role: formData.role,
        company_id: companyId,
        updated_at: new Date().toISOString()
      });

    if (roleError) throw roleError;

    toast({
      title: "Sucesso",
      description: "Usuário atualizado com sucesso!",
    });

    return true;
  } catch (error: any) {
    console.error('Erro ao atualizar usuário:', error);
    toast({
      title: "Erro",
      description: error.message || "Erro ao atualizar usuário",
      variant: "destructive",
    });
    return false;
  }
};
