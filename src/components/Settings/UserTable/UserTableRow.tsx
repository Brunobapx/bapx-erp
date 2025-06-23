
import React from 'react';
import { TableCell, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { SimpleUser } from '@/hooks/useUserData';
import { UserActionsMenu } from './UserActionsMenu';
import { UserRoleSelect } from './UserRoleSelect';
import { UserProfileSelect } from './UserProfileSelect';

interface UserTableRowProps {
  user: SimpleUser;
  userRole: string;
  currentUserId?: string;
  onStatusChange: (userId: string, isActive: boolean) => void;
  onRoleChange: (userId: string, role: string) => void;
  onProfileChange: (userId: string, profileId: string) => void;
  onDeleteUser: (userId: string, userName: string) => void;
  onEditUser: (user: SimpleUser) => void;
  availableProfiles: Array<{id: string; name: string; description: string; is_active: boolean}>;
}

export const UserTableRow: React.FC<UserTableRowProps> = ({
  user,
  userRole,
  currentUserId,
  onStatusChange,
  onRoleChange,
  onProfileChange,
  onDeleteUser,
  onEditUser,
  availableProfiles,
}) => {
  const getDisplayName = (user: SimpleUser) => {
    if (!user) return 'Usuário não identificado';
    const fullName = `${user.first_name || ''} ${user.last_name || ''}`.trim();
    return fullName || 'Nome não informado';
  };

  const getProfileDisplayName = (user: SimpleUser) => {
    if (!user || !user.access_profile?.name) return 'Sem perfil';
    return user.access_profile.name;
  };

  const canManageUser = (user: SimpleUser) => {
    if (!user || !userRole) return false;
    if (userRole === 'master') return true;
    if (userRole === 'admin' && user.role !== 'master') return true;
    return false;
  };

  if (!user?.id) {
    console.warn('Invalid user found:', user);
    return null;
  }

  return (
    <TableRow key={user.id}>
      <TableCell className="font-medium">{getDisplayName(user)}</TableCell>
      <TableCell>{user.email || 'Email não disponível'}</TableCell>
      <TableCell>
        <UserRoleSelect
          user={user}
          userRole={userRole}
          canManage={canManageUser(user)}
          onRoleChange={onRoleChange}
        />
      </TableCell>
      <TableCell>
        <UserProfileSelect
          user={user}
          canManage={canManageUser(user)}
          availableProfiles={availableProfiles}
          onProfileChange={onProfileChange}
          displayName={getProfileDisplayName(user)}
        />
      </TableCell>
      <TableCell>{user.department || '-'}</TableCell>
      <TableCell>
        <Badge variant={user.is_active ? 'default' : 'secondary'}>
          {user.is_active ? 'Ativo' : 'Inativo'}
        </Badge>
      </TableCell>
      <TableCell>
        <UserActionsMenu
          user={user}
          currentUserId={currentUserId}
          canManage={canManageUser(user)}
          onStatusChange={onStatusChange}
          onDeleteUser={onDeleteUser}
          onEditUser={onEditUser}
          displayName={getDisplayName(user)}
        />
      </TableCell>
    </TableRow>
  );
};
