
import { supabase } from "@/integrations/supabase/client";

export const userActionsService = {
  async updateUserStatus(userId: string, isActive: boolean): Promise<void> {
    const { error } = await supabase
      .from('profiles')
      .update({ is_active: isActive })
      .eq('id', userId);
      
    if (error) throw error;
  },

  async updateUserRole(userId: string, role: string, companyId: string): Promise<void> {
    const { error } = await supabase
      .from('user_roles')
      .upsert({ user_id: userId, role, company_id: companyId });

    if (error) throw error;
  },

  async updateUserProfile(userId: string, profileId: string): Promise<void> {
    const { error } = await supabase
      .from('profiles')
      .update({ 
        profile_id: profileId || null,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId);

    if (error) throw error;
  },

  async deleteUser(userId: string): Promise<void> {
    const { error } = await supabase.functions.invoke('delete-user', {
      body: { userId },
    });

    if (error) throw error;
  }
};
