
import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SimpleUser } from '@/hooks/useUserData';

interface UserRoleSelectProps {
  user: SimpleUser;
  userRole: string;
  canManage: boolean;
  onRoleChange: (userId: string, role: string) => void;
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

  return (
    <Select
      value={user.role || 'user'}
      disabled={!canManage}
      onValueChange={(role) => onRoleChange(user.id, role)}
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
