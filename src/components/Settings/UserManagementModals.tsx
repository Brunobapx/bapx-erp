
import React from 'react';
import CreateUserModal from './CreateUserModal';
import { DeleteUserModal } from './DeleteUserModal';

interface AccessProfile {
  id: string;
  name: string;
  description: string;
  is_active: boolean;
}

interface UserManagementModalsProps {
  isCreateUserModalOpen: boolean;
  setIsCreateUserModalOpen: (open: boolean) => void;
  deleteUserModal: {
    open: boolean;
    userId: string;
    userName: string;
    userEmail: string;
  };
  setDeleteUserModal: React.Dispatch<React.SetStateAction<{
    open: boolean;
    userId: string;
    userName: string;
    userEmail: string;
  }>>;
  availableProfiles: AccessProfile[];
  userRole: string;
  currentUserId?: string;
  onUserCreated: () => void;
  onDeleteUser: (userId: string) => Promise<void>;
}

export const UserManagementModals: React.FC<UserManagementModalsProps> = ({
  isCreateUserModalOpen,
  setIsCreateUserModalOpen,
  deleteUserModal,
  setDeleteUserModal,
  availableProfiles,
  userRole,
  currentUserId,
  onUserCreated,
  onDeleteUser
}) => {
  return (
    <>
      <CreateUserModal
        open={isCreateUserModalOpen}
        setOpen={setIsCreateUserModalOpen}
        onSuccess={onUserCreated}
        availableProfiles={availableProfiles}
        userRole={userRole}
      />

      <DeleteUserModal
        userId={deleteUserModal.userId}
        userName={deleteUserModal.userName}
        userEmail={deleteUserModal.userEmail}
        open={deleteUserModal.open}
        onOpenChange={(open) => setDeleteUserModal(prev => ({ ...prev, open }))}
        onConfirm={onDeleteUser}
        currentUserId={currentUserId}
      />
    </>
  );
};
