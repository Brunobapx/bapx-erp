
import { useMemo } from 'react';
import { useAuth } from '@/components/Auth/AuthProvider';
import { UnifiedUser } from '@/hooks/useUnifiedUserManagement';

interface UserPermissions {
  canViewUserDetails: boolean;
  canCreateUsers: boolean;
  canEditUsers: boolean;
  canDeleteUsers: boolean;
  canManageRoles: boolean;
  canManageProfiles: boolean;
  canViewAuditLogs: boolean;
  canManageCompany: boolean;
}

export const useUserPermissions = () => {
  const { userRole } = useAuth();

  const permissions = useMemo((): UserPermissions => {
    if (!userRole) {
      return {
        canViewUserDetails: false,
        canCreateUsers: false,
        canEditUsers: false,
        canDeleteUsers: false,
        canManageRoles: false,
        canManageProfiles: false,
        canViewAuditLogs: false,
        canManageCompany: false,
      };
    }

    switch (userRole) {
      case 'master':
        return {
          canViewUserDetails: true,
          canCreateUsers: true,
          canEditUsers: true,
          canDeleteUsers: true,
          canManageRoles: true,
          canManageProfiles: true,
          canViewAuditLogs: true,
          canManageCompany: true,
        };

      case 'admin':
        return {
          canViewUserDetails: true,
          canCreateUsers: true,
          canEditUsers: true,
          canDeleteUsers: true,
          canManageRoles: true,
          canManageProfiles: true,
          canViewAuditLogs: true,
          canManageCompany: false,
        };

      case 'user':
      default:
        return {
          canViewUserDetails: false,
          canCreateUsers: false,
          canEditUsers: false,
          canDeleteUsers: false,
          canManageRoles: false,
          canManageProfiles: false,
          canViewAuditLogs: false,
          canManageCompany: false,
        };
    }
  }, [userRole]);

  const hasPermission = (permission: keyof UserPermissions): boolean => {
    return permissions[permission];
  };

  const canManageUser = (targetUser: UnifiedUser): boolean => {
    if (!userRole || !targetUser) return false;
    
    // Master pode gerenciar qualquer usuário
    if (userRole === 'master') return true;
    
    // Admin pode gerenciar usuários que não sejam master
    if (userRole === 'admin' && targetUser.role !== 'master') return true;
    
    return false;
  };

  return {
    permissions,
    hasPermission,
    canManageUser,
  };
};
