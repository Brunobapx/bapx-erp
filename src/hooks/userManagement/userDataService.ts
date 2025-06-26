
import { supabase } from "@/integrations/supabase/client";
import { UnifiedUser } from './types';

export const userDataService = {
  async fetchUsers(companyId: string): Promise<UnifiedUser[]> {
    console.log('[UnifiedUserManagement] Loading users from database');
    
    // First query: fetch profiles
    const { data: profilesData, error: profilesError } = await supabase
      .from('profiles')
      .select(`
        id,
        first_name,
        last_name,
        department,
        position,
        is_active,
        last_login,
        profile_id,
        access_profiles(name, description)
      `)
      .eq('company_id', companyId)
      .order('first_name');

    if (profilesError) {
      console.error('[UnifiedUserManagement] Error loading profiles:', profilesError);
      throw profilesError;
    }

    // Second query: fetch user roles
    const userIds = (profilesData || []).map(profile => profile.id);
    const { data: rolesData, error: rolesError } = await supabase
      .from('user_roles')
      .select('user_id, role')
      .in('user_id', userIds)
      .eq('company_id', companyId);

    if (rolesError) {
      console.error('[UnifiedUserManagement] Error loading roles:', rolesError);
      throw rolesError;
    }

    // Create roles map for easy access
    const rolesMap = new Map<string, string>();
    (rolesData || []).forEach(roleData => {
      rolesMap.set(roleData.user_id, roleData.role);
    });

    return this.processUserData(profilesData || [], rolesMap);
  },

  processUserData(profilesData: any[], rolesMap: Map<string, string>): UnifiedUser[] {
    return profilesData.map((profile) => {
      // Get user role
      const userRole = rolesMap.get(profile.id) || 'user';
      
      // Normalize access_profile
      let accessProfile: { name: string; description: string; } | null = null;
      
      if (profile.access_profiles) {
        const profiles = profile.access_profiles as any;
        
        if (Array.isArray(profiles) && profiles.length > 0) {
          accessProfile = {
            name: profiles[0]?.name || '',
            description: profiles[0]?.description || ''
          };
        } else if (typeof profiles === 'object' && profiles.name !== undefined) {
          accessProfile = {
            name: profiles.name || '',
            description: profiles.description || ''
          };
        }
      }

      return {
        id: profile.id,
        first_name: profile.first_name || '',
        last_name: profile.last_name || '',
        email: `user-${profile.id.substring(0, 8)}@sistema.local`,
        role: userRole,
        is_active: profile.is_active ?? true,
        last_login: profile.last_login || '',
        department: profile.department || '',
        position: profile.position || '',
        profile_id: profile.profile_id || '',
        access_profile: accessProfile
      };
    });
  }
};
