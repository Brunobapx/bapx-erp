
import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import EditUserForm from './EditUser/EditUserForm';
import { useEditUserForm } from './EditUser/useEditUserForm';
import { UnifiedUser } from '@/hooks/useUnifiedUserManagement';

interface EditUserModalProps {
  user: UnifiedUser | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  availableProfiles: Array<{id: string; name: string; description: string; is_active: boolean}>;
  userRole: string;
}

const EditUserModal: React.FC<EditUserModalProps> = ({
  user, open, onOpenChange, onSuccess, availableProfiles, userRole
}) => {
  const {
    form,
    validationErrors,
    loading,
    handleFieldChange,
    handleSubmit,
  } = useEditUserForm({
    user,
    onSuccess,
    setOpen: onOpenChange,
  });

  if (!user) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Editar Usuário</DialogTitle>
        </DialogHeader>
        <EditUserForm
          user={user}
          form={form}
          validationErrors={validationErrors}
          loading={loading}
          availableProfiles={availableProfiles}
          userRole={userRole}
          onFieldChange={handleFieldChange}
          onSubmit={handleSubmit}
        />
      </DialogContent>
    </Dialog>
  );
};

export default EditUserModal;
