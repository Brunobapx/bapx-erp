
import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { EditUserForm } from './EditUser/EditUserForm';
import { useEditUserForm } from './EditUser/useEditUserForm';
import { SimpleUser } from '@/hooks/useSimpleUserManagement';

interface AccessProfile {
  id: string;
  name: string;
  description: string;
  is_active: boolean;
}

interface EditUserModalProps {
  user: SimpleUser | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  availableProfiles: AccessProfile[];
  userRole: string;
}

export const EditUserModal = ({
  user,
  open,
  onOpenChange,
  onSuccess,
  availableProfiles,
  userRole
}: EditUserModalProps) => {
  const {
    formData,
    loading,
    canManageUser,
    handleFormDataChange,
    handleSubmit,
  } = useEditUserForm({
    user,
    userRole,
    onSuccess,
    onClose: () => onOpenChange(false)
  });

  if (!user) return null;

  const isEditable = canManageUser(user);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Editar Usuário</DialogTitle>
        </DialogHeader>
        
        <EditUserForm
          formData={formData}
          user={user}
          availableProfiles={availableProfiles}
          userRole={userRole}
          isEditable={isEditable}
          loading={loading}
          onFormDataChange={handleFormDataChange}
          onSubmit={handleSubmit}
          onCancel={() => onOpenChange(false)}
        />
      </DialogContent>
    </Dialog>
  );
};
