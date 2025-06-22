
import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { EditUserForm } from './EditUser/EditUserForm';
import { SimpleUser } from '@/hooks/useUserData';

interface EditUserModalProps {
  user: SimpleUser | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  availableProfiles: Array<{id: string; name: string; description: string; is_active: boolean}>;
  userRole: string;
}

export const EditUserModal: React.FC<EditUserModalProps> = ({
  user,
  open,
  onOpenChange,
  onSuccess,
  availableProfiles,
  userRole,
}) => {
  const handleClose = () => {
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            Editar Usuário: {user ? `${user.first_name} ${user.last_name}` : ''}
          </DialogTitle>
        </DialogHeader>
        
        {user && (
          <EditUserForm
            user={user}
            userRole={userRole}
            onSuccess={onSuccess}
            onClose={handleClose}
            availableProfiles={availableProfiles}
          />
        )}
      </DialogContent>
    </Dialog>
  );
};
