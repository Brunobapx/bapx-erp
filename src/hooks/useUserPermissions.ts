
import { useState, useEffect } from 'react';
import { useAuth } from '@/components/Auth/AuthProvider';

interface Permissions {
  canViewUserDetails: boolean;
  canCreateUsers: boolean;
  canEditUsers: boolean;
  canDeleteUsers: boolean;
  canManageProfiles: boolean;
  canViewSecuritySettings: boolean;
}

export const useUserPermissions = () => {
  const { userRole } = useAuth();
  const [permissions, setPermissions] = useState<Permissions>({
    canViewUserDetails: false,
    canCreateUsers: false,
    canEditUsers: false,
    canDeleteUsers: false,
    canManageProfiles: false,
    canViewSecuritySettings: false,
  });

  console.log('[useUserPermissions] Hook initialized, userRole:', userRole);

  useEffect(() => {
    if (!userRole) {
      console.log('[useUserPermissions] No user role, setting all permissions to false');
      setPermissions({
        canViewUserDetails: false,
        canCreateUsers: false,
        canEditUsers: false,
        canDeleteUsers: false,
        canManageProfiles: false,
        canViewSecuritySettings: false,
      });
      return;
    }

    console.log('[useUserPermissions] Setting permissions for role:', userRole);

    // Master tem todas as permissões
    if (userRole === 'master') {
      setPermissions({
        canViewUserDetails: true,
        canCreateUsers: true,
        canEditUsers: true,
        canDeleteUsers: true,
        canManageProfiles: true,
        canViewSecuritySettings: true,
      });
      return;
    }

    // Admin tem quase todas as permissões, exceto deletar masters
    if (userRole === 'admin') {
      setPermissions({
        canViewUserDetails: true,
        canCreateUsers: true,
        canEditUsers: true,
        canDeleteUsers: true,
        canManageProfiles: true,
        canViewSecuritySettings: true,
      });
      return;
    }

    // User comum tem permissões limitadas
    setPermissions({
      canViewUserDetails: false,
      canCreateUsers: false,
      canEditUsers: false,
      canDeleteUsers: false,
      canManageProfiles: false,
      canViewSecuritySettings: false,
    });
  }, [userRole]);

  const hasPermission = (permission: keyof Permissions): boolean => {
    const result = permissions[permission];
    console.log('[useUserPermissions] Checking permission:', permission, 'result:', result);
    return result;
  };

  return {
    permissions,
    hasPermission,
  };
};
