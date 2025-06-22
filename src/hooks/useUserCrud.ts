
import { useUserCreate, useUserUpdate, useUserDelete } from './userCrud';
import type { CreateUserData, UpdateUserData } from './userCrud';

export type { CreateUserData, UpdateUserData };

export const useUserCrud = () => {
  const { createUser, loading: createLoading } = useUserCreate();
  const { updateUser, updateUserStatus, loading: updateLoading } = useUserUpdate();
  const { deleteUser, loading: deleteLoading } = useUserDelete();

  const loading = createLoading || updateLoading || deleteLoading;

  return {
    createUser,
    updateUser,
    updateUserStatus,
    deleteUser,
    loading,
  };
};
