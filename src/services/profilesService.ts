
import { supabase } from '@/integrations/supabase/client';
import { AccessProfile } from '@/types/profiles';

export const profilesService = {
  async loadProfiles(companyId: string): Promise<AccessProfile[]> {
    console.log('Loading profiles for company:', companyId);
    
    const { data, error } = await supabase
      .from('access_profiles')
      .select('*')
      .eq('company_id', companyId)
      .order('name');

    if (error) {
      console.error('Error loading profiles:', error);
      throw error;
    }
    
    console.log('Loaded profiles:', data);
    return data || [];
  },

  async createProfile(profileData: Omit<AccessProfile, 'id' | 'created_at' | 'updated_at'>): Promise<AccessProfile> {
    console.log('Creating profile:', profileData);
    
    const { data, error } = await supabase
      .from('access_profiles')
      .insert(profileData)
      .select()
      .single();

    if (error) {
      console.error('Error creating profile:', error);
      throw error;
    }
    
    return data;
  },

  async updateProfile(profileId: string, profileData: Partial<AccessProfile>): Promise<void> {
    console.log('Updating profile:', profileId, profileData);
    
    const updateData = {
      name: profileData.name,
      description: profileData.description,
      is_admin: profileData.is_admin,
      is_active: profileData.is_active,
      updated_at: new Date().toISOString()
    };

    const { error } = await supabase
      .from('access_profiles')
      .update(updateData)
      .eq('id', profileId);

    if (error) {
      console.error('Error updating profile:', error);
      throw error;
    }
    
    console.log('Profile updated successfully');
  },

  async deleteProfile(profileId: string): Promise<void> {
    console.log('Deleting profile:', profileId);
    
    // Primeiro remover módulos do perfil
    const { error: modulesError } = await supabase
      .from('profile_modules')
      .delete()
      .eq('profile_id', profileId);

    if (modulesError) {
      console.error('Error deleting profile modules:', modulesError);
      throw modulesError;
    }

    // Depois remover o perfil
    const { error } = await supabase
      .from('access_profiles')
      .delete()
      .eq('id', profileId);

    if (error) {
      console.error('Error deleting profile:', error);
      throw error;
    }
  }
};
