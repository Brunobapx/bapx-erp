
import React from 'react';
import { Button } from "@/components/ui/button";
import { Edit, Trash2 } from 'lucide-react';
import { UnifiedUser } from '@/hooks/useUnifiedUserManagement';

interface UserActionsMenuProps {
  user: UnifiedUser;
  currentUserId?: string;
  canManage: boolean;
  onStatusChange: (userId: string, isActive: boolean) => Promise<boolean>;
  onDeleteUser: (userId: string, userName: string) => void;
  onEditUser: (user: UnifiedUser) => void;
  displayName: string;
}

export const UserActionsMenu: React.FC<UserActionsMenuProps> = ({
  user,
  currentUserId,
  canManage,
  onStatusChange,
  onDeleteUser,
  onEditUser,
  displayName,
}) => {
  const handleStatusChange = async () => {
    await onStatusChange(user.id, !user.is_active);
  };

  return (
    <div className="flex gap-2">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => onEditUser(user)}
        disabled={!canManage}
        title="Editar usuário"
      >
        <Edit className="h-4 w-4" />
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={handleStatusChange}
        disabled={!canManage}
        title={user.is_active ? 'Desativar usuário' : 'Ativar usuário'}
      >
        {user.is_active ? 'Desativar' : 'Ativar'}
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => onDeleteUser(user.id, displayName)}
        disabled={user.id === currentUserId || !canManage}
        className="text-red-600 hover:text-red-800"
        title="Excluir usuário"
      >
        <Trash2 className="h-4 w-4" />
      </Button>
    </div>
  );
};
