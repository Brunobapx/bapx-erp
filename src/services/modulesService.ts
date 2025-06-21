
import { supabase } from '@/integrations/supabase/client';
import { SystemModule, ProfileModule, ModulePermission } from '@/types/profiles';

export const modulesService = {
  async loadModules(): Promise<SystemModule[]> {
    console.log('Loading system modules');
    
    try {
      const { data, error } = await supabase
        .from('system_modules')
        .select('*')
        .eq('is_active', true)
        .order('category, sort_order');

      if (error) {
        console.error('Error loading modules:', error.message);
        throw new Error(`Falha ao carregar módulos do sistema: ${error.message}`);
      }
      
      console.log('Loaded modules:', data?.length || 0);
      return data || [];
    } catch (error) {
      console.error('Unexpected error loading modules:', error);
      throw error;
    }
  },

  async loadProfileModules(profileId: string): Promise<ProfileModule[]> {
    console.log('Loading modules for profile:', profileId);
    
    if (!profileId || profileId.trim() === '') {
      console.error('Invalid profile ID provided');
      throw new Error('ID do perfil é obrigatório');
    }

    try {
      // Primeiro, verificar se o perfil existe
      const { data: profileExists, error: profileError } = await supabase
        .from('access_profiles')
        .select('id')
        .eq('id', profileId)
        .single();

      if (profileError) {
        console.error('Profile not found:', profileError.message);
        throw new Error('Perfil não encontrado');
      }

      if (!profileExists) {
        throw new Error('Perfil não existe');
      }

      // Buscar módulos do perfil com dados dos módulos separadamente
      const { data: profileModules, error: modulesError } = await supabase
        .from('profile_modules')
        .select('*')
        .eq('profile_id', profileId);

      if (modulesError) {
        console.error('Error loading profile modules:', modulesError.message);
        throw new Error(`Falha ao carregar módulos do perfil: ${modulesError.message}`);
      }

      if (!profileModules || profileModules.length === 0) {
        console.log('No modules found for profile:', profileId);
        return [];
      }

      // Buscar informações dos módulos do sistema
      const moduleIds = profileModules.map(pm => pm.module_id);
      const { data: systemModules, error: systemError } = await supabase
        .from('system_modules')
        .select('*')
        .in('id', moduleIds)
        .eq('is_active', true);

      if (systemError) {
        console.error('Error loading system modules:', systemError.message);
        throw new Error(`Falha ao carregar informações dos módulos: ${systemError.message}`);
      }

      // Combinar os dados
      const result = profileModules.map(pm => ({
        ...pm,
        module: systemModules?.find(sm => sm.id === pm.module_id)
      }));

      console.log('Profile modules loaded successfully:', result.length);
      return result;
    } catch (error: any) {
      console.error('Error in loadProfileModules:', error);
      if (error.message) {
        throw error;
      }
      throw new Error('Erro inesperado ao carregar módulos do perfil');
    }
  },

  async updateProfileModules(
    profileId: string, 
    modulePermissions: ModulePermission[]
  ): Promise<void> {
    console.log('Updating profile modules:', profileId, modulePermissions.length);
    
    if (!profileId || profileId.trim() === '') {
      throw new Error('ID do perfil é obrigatório');
    }

    try {
      // Verificar se o perfil existe
      const { data: profileExists, error: profileError } = await supabase
        .from('access_profiles')
        .select('id')
        .eq('id', profileId)
        .single();

      if (profileError || !profileExists) {
        throw new Error('Perfil não encontrado');
      }

      // Remover permissões existentes
      const { error: deleteError } = await supabase
        .from('profile_modules')
        .delete()
        .eq('profile_id', profileId);

      if (deleteError) {
        console.error('Error deleting existing profile modules:', deleteError.message);
        throw new Error(`Falha ao remover permissões existentes: ${deleteError.message}`);
      }

      // Inserir novas permissões
      if (modulePermissions.length > 0) {
        const insertData = modulePermissions.map(perm => ({
          profile_id: profileId,
          module_id: perm.moduleId,
          can_view: perm.canView,
          can_edit: perm.canEdit,
          can_delete: perm.canDelete
        }));

        console.log('Inserting new profile modules:', insertData.length);

        const { error: insertError } = await supabase
          .from('profile_modules')
          .insert(insertData);

        if (insertError) {
          console.error('Error inserting profile modules:', insertError.message);
          throw new Error(`Falha ao salvar novas permissões: ${insertError.message}`);
        }
      }
      
      console.log('Profile modules updated successfully');
    } catch (error: any) {
      console.error('Error in updateProfileModules:', error);
      if (error.message) {
        throw error;
      }
      throw new Error('Erro inesperado ao atualizar módulos do perfil');
    }
  }
};
