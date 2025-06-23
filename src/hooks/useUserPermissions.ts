
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

  useEffect(() => {
    if (!userRole) {
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

    // Admin tem quase todas as permissões
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
    return permissions[permission];
  };

  return {
    permissions,
    hasPermission,
  };
};
