
import React from 'react';
import { CreateUserModal } from '../CreateUser/CreateUserModal';
import EditUserModal from '../EditUserModal';
import { DeleteUserModal } from '../DeleteUserModal';
import { UnifiedUser } from '@/hooks/useUnifiedUserManagement';

interface AccessProfile {
  id: string;
  name: string;
  description: string;
  is_active: boolean;
}

interface UserManagementModalsProps {
  // Create Modal
  createModalOpen: boolean;
  setCreateModalOpen: (open: boolean) => void;
  
  // Edit Modal
  editModalOpen: boolean;
  setEditModalOpen: (open: boolean) => void;
  selectedUser: UnifiedUser | null;
  
  // Delete Modal
  deleteModalOpen: boolean;
  setDeleteModalOpen: (open: boolean) => void;
  userToDelete: { id: string; name: string; email: string };
  
  // Common props
  availableProfiles: AccessProfile[];
  userRole: string;
  currentUserId?: string;
  
  // Callbacks
  onSuccess: () => void;
  onDeleteConfirm: (userId: string) => Promise<void>;
}

export const UserManagementModals: React.FC<UserManagementModalsProps> = ({
  createModalOpen,
  setCreateModalOpen,
  editModalOpen,
  setEditModalOpen,
  selectedUser,
  deleteModalOpen,
  setDeleteModalOpen,
  userToDelete,
  availableProfiles,
  userRole,
  currentUserId,
  onSuccess,
  onDeleteConfirm
}) => {
  return (
    <>
      <CreateUserModal
        open={createModalOpen}
        setOpen={setCreateModalOpen}
        onSuccess={onSuccess}
        availableProfiles={availableProfiles}
        userRole={userRole}
      />

      <EditUserModal
        user={selectedUser}
        open={editModalOpen}
        onOpenChange={setEditModalOpen}
        onSuccess={onSuccess}
        availableProfiles={availableProfiles}
        userRole={userRole}
      />

      <DeleteUserModal
        userId={userToDelete.id}
        userName={userToDelete.name}
        userEmail={userToDelete.email}
        open={deleteModalOpen}
        onOpenChange={setDeleteModalOpen}
        onConfirm={onDeleteConfirm}
        currentUserId={currentUserId}
      />
    </>
  );
};
