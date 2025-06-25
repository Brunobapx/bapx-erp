
import React from 'react';
import { UserManagementErrorBoundary } from '../../ErrorBoundary/UserManagementErrorBoundary';
import { UserManagementHeader } from './UserManagementHeader';
import { UserManagementStats } from './UserManagementStats';
import SimpleUsersTable from '../SimpleUsersTable';
import { UserManagementModals } from './UserManagementModals';
import { UnifiedUser } from '@/hooks/useUnifiedUserManagement';

interface AccessProfile {
  id: string;
  name: string;
  description: string;
  is_active: boolean;
}

interface UserManagementContainerProps {
  // Data
  users: UnifiedUser[];
  availableProfiles: AccessProfile[];
  userRole: string;
  currentUserId?: string;
  loading: boolean;
  
  // Actions
  onRefresh: () => void;
  onStatusChange: (userId: string, isActive: boolean) => Promise<boolean>;
  onRoleChange: (userId: string, role: string) => Promise<boolean>;
  onProfileChange: (userId: string, profileId: string) => Promise<boolean>;
  onDeleteUser: (userId: string, userName: string, userEmail?: string) => void;
  onEditUser: (user: UnifiedUser) => void;
  
  // Modal states
  createModalOpen: boolean;
  setCreateModalOpen: (open: boolean) => void;
  editModalOpen: boolean;
  setEditModalOpen: (open: boolean) => void;
  selectedUser: UnifiedUser | null;
  deleteModalOpen: boolean;
  setDeleteModalOpen: (open: boolean) => void;
  userToDelete: { id: string; name: string; email: string };
  
  // Callbacks
  onSuccess: () => void;
  onDeleteConfirm: (userId: string) => Promise<void>;
  canCreateUsers: boolean;
}

export const UserManagementContainer: React.FC<UserManagementContainerProps> = ({
  users,
  availableProfiles,
  userRole,
  currentUserId,
  loading,
  onRefresh,
  onStatusChange,
  onRoleChange,
  onProfileChange,
  onDeleteUser,
  onEditUser,
  createModalOpen,
  setCreateModalOpen,
  editModalOpen,
  setEditModalOpen,
  selectedUser,
  deleteModalOpen,
  setDeleteModalOpen,
  userToDelete,
  onSuccess,
  onDeleteConfirm,
  canCreateUsers
}) => {
  return (
    <UserManagementErrorBoundary>
      <div className="space-y-6">
        <UserManagementHeader
          usersCount={users.length}
          loading={loading}
          onRefresh={onRefresh}
          onNewUser={() => setCreateModalOpen(true)}
          canCreateUsers={canCreateUsers}
        />

        <UserManagementStats users={users} />

        <SimpleUsersTable
          users={users}
          userRole={userRole}
          currentUserId={currentUserId}
          onStatusChange={onStatusChange}
          onRoleChange={onRoleChange}
          onProfileChange={onProfileChange}
          onDeleteUser={onDeleteUser}
          onEditUser={onEditUser}
          loading={loading}
          availableProfiles={availableProfiles}
        />

        <UserManagementModals
          createModalOpen={createModalOpen}
          setCreateModalOpen={setCreateModalOpen}
          editModalOpen={editModalOpen}
          setEditModalOpen={setEditModalOpen}
          selectedUser={selectedUser}
          deleteModalOpen={deleteModalOpen}
          setDeleteModalOpen={setDeleteModalOpen}
          userToDelete={userToDelete}
          availableProfiles={availableProfiles}
          userRole={userRole}
          currentUserId={currentUserId}
          onSuccess={onSuccess}
          onDeleteConfirm={onDeleteConfirm}
        />
      </div>
    </UserManagementErrorBoundary>
  );
};
