
import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import CreateUserForm from './CreateUserForm';
import { useCreateUserForm } from './useCreateUserForm';

interface AccessProfile {
  id: string;
  name: string;
  description: string;
  is_active: boolean;
}

interface CreateUserModalProps {
  open: boolean;
  setOpen: (open: boolean) => void;
  onSuccess: () => void;
  availableProfiles: AccessProfile[];
  userRole: string;
}

const CreateUserModal: React.FC<CreateUserModalProps> = ({
  open, setOpen, onSuccess, availableProfiles, userRole
}) => {
  const {
    form,
    handleChange,
    handleSubmit,
    validationErrors,
    loading,
  } = useCreateUserForm({ onSuccess, setOpen, userRole });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Novo Usuário</DialogTitle>
        </DialogHeader>
        <CreateUserForm
          form={form}
          validationErrors={validationErrors}
          loading={loading}
          availableProfiles={availableProfiles}
          userRole={userRole}
          onFieldChange={handleChange}
          onSubmit={handleSubmit}
        />
      </DialogContent>
    </Dialog>
  );
};

export default CreateUserModal;
