
import { supabase } from '@/integrations/supabase/client';
import { SystemModule, ProfileModule, ModulePermission } from '@/types/profiles';

export const modulesService = {
  async loadModules(): Promise<SystemModule[]> {
    console.log('Loading system modules');
    
    const { data, error } = await supabase
      .from('system_modules')
      .select('*')
      .eq('is_active', true)
      .order('category, sort_order');

    if (error) {
      console.error('Error loading modules:', error);
      throw error;
    }
    
    console.log('Loaded modules:', data);
    return data || [];
  },

  async loadProfileModules(profileId: string): Promise<ProfileModule[]> {
    console.log('Loading modules for profile:', profileId);
    
    const { data, error } = await supabase
      .from('profile_modules')
      .select(`
        *,
        system_modules(*)
      `)
      .eq('profile_id', profileId);

    if (error) {
      console.error('Error loading profile modules:', error);
      throw error;
    }

    console.log('Profile modules loaded:', data?.length || 0);
    return data || [];
  },

  async updateProfileModules(
    profileId: string, 
    modulePermissions: ModulePermission[]
  ): Promise<void> {
    console.log('Updating profile modules:', profileId, modulePermissions);
    
    // Primeiro, remove todas as permissões existentes do perfil
    const { error: deleteError } = await supabase
      .from('profile_modules')
      .delete()
      .eq('profile_id', profileId);

    if (deleteError) {
      console.error('Error deleting existing profile modules:', deleteError);
      throw deleteError;
    }

    // Depois, insere as novas permissões
    if (modulePermissions.length > 0) {
      const insertData = modulePermissions.map(perm => ({
        profile_id: profileId,
        module_id: perm.moduleId,
        can_view: perm.canView,
        can_edit: perm.canEdit,
        can_delete: perm.canDelete
      }));

      console.log('Inserting new profile modules:', insertData);

      const { error } = await supabase
        .from('profile_modules')
        .insert(insertData);

      if (error) {
        console.error('Error inserting profile modules:', error);
        throw error;
      }
    }
    
    console.log('Profile modules updated successfully');
  }
};
