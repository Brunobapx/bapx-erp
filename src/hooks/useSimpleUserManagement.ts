
import { useUserData } from './useUserData';
import { useUserActions } from './useUserActions';

export type { SimpleUser } from './useUserData';

export const useSimpleUserManagement = () => {
  const { users, loading, loadUsers } = useUserData();
  const { updateUserStatus, updateUserRole, updateUserProfile } = useUserActions();

  const handleUserStatusUpdate = async (userId: string, isActive: boolean) => {
    const success = await updateUserStatus(userId, isActive);
    if (success) {
      await loadUsers();
    }
  };

  const handleUserRoleUpdate = async (userId: string, role: string) => {
    const success = await updateUserRole(userId, role);
    if (success) {
      await loadUsers();
    }
  };

  const handleUserProfileUpdate = async (userId: string, profileId: string) => {
    const success = await updateUserProfile(userId, profileId);
    if (success) {
      await loadUsers();
    }
  };

  return {
    users,
    loading,
    loadUsers,
    updateUserStatus: handleUserStatusUpdate,
    updateUserRole: handleUserRoleUpdate,
    updateUserProfile: handleUserProfileUpdate,
  };
};
