
import { useAuth } from '@/components/Auth/AuthProvider';
import { SimpleUser } from '@/hooks/useUserData';

export interface UserPermissions {
  canCreateUsers: boolean;
  canEditUsers: boolean;
  canDeleteUsers: boolean;
  canManageRoles: boolean;
  canManageProfiles: boolean;
  canViewUserDetails: boolean;
}

export const useUserPermissions = () => {
  const { userRole } = useAuth();

  const getPermissions = (): UserPermissions => {
    switch (userRole) {
      case 'master':
        return {
          canCreateUsers: true,
          canEditUsers: true,
          canDeleteUsers: true,
          canManageRoles: true,
          canManageProfiles: true,
          canViewUserDetails: true,
        };
      case 'admin':
        return {
          canCreateUsers: true,
          canEditUsers: true,
          canDeleteUsers: true,
          canManageRoles: false, // Admin não pode gerenciar roles de master
          canManageProfiles: true,
          canViewUserDetails: true,
        };
      default:
        return {
          canCreateUsers: false,
          canEditUsers: false,
          canDeleteUsers: false,
          canManageRoles: false,
          canManageProfiles: false,
          canViewUserDetails: false,
        };
    }
  };

  const canManageUser = (targetUser: SimpleUser): boolean => {
    if (userRole === 'master') return true;
    if (userRole === 'admin' && targetUser.role !== 'master') return true;
    return false;
  };

  const canAssignRole = (targetRole: string): boolean => {
    if (userRole === 'master') return true;
    if (userRole === 'admin' && targetRole !== 'master') return true;
    return false;
  };

  const hasPermission = (action: keyof UserPermissions): boolean => {
    const permissions = getPermissions();
    return permissions[action];
  };

  return {
    permissions: getPermissions(),
    canManageUser,
    canAssignRole,
    hasPermission,
    userRole,
  };
};
