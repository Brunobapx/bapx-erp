
import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { UnifiedUser } from '@/hooks/useUnifiedUserManagement';

interface UserRoleSelectProps {
  user: UnifiedUser;
  userRole: string;
  canManage: boolean;
  onRoleChange: (userId: string, role: string) => Promise<boolean>;
}

export const UserRoleSelect: React.FC<UserRoleSelectProps> = ({
  user,
  userRole,
  canManage,
  onRoleChange,
}) => {
  const getRoleDisplayName = (role: string) => {
    switch (role) {
      case 'admin': return 'Admin';
      case 'master': return 'Master';
      case 'user': return 'Usuário';
      default: return 'Usuário';
    }
  };

  const handleRoleChange = async (role: string) => {
    await onRoleChange(user.id, role);
  };

  return (
    <Select
      value={user.role || 'user'}
      disabled={!canManage}
      onValueChange={handleRoleChange}
    >
      <SelectTrigger className="w-32">
        <SelectValue>
          {getRoleDisplayName(user.role)}
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="user">Usuário</SelectItem>
        <SelectItem value="admin">Admin</SelectItem>
        {userRole === 'master' && (
          <SelectItem value="master">Master</SelectItem>
        )}
      </SelectContent>
    </Select>
  );
};
