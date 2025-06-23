
import React from 'react';
import { TableCell, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Edit, Trash2, UserCheck, UserX } from 'lucide-react';
import { SimpleUser } from '@/hooks/useUserData';

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
  onDeleteUser,
  onEditUser,
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

  const handleDeleteUser = () => {
    if (window.confirm(`Tem certeza que deseja excluir o usuário "${getDisplayName(user)}"? Esta ação não pode ser desfeita.`)) {
      onDeleteUser(user.id, getDisplayName(user));
    }
  };

  const handleToggleStatus = () => {
    const action = user.is_active ? 'desativar' : 'ativar';
    if (window.confirm(`Tem certeza que deseja ${action} o usuário "${getDisplayName(user)}"?`)) {
      onStatusChange(user.id, !user.is_active);
    }
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
        <span className="text-sm text-gray-700">
          {getProfileDisplayName(user)}
        </span>
      </TableCell>
      <TableCell>{user.department || '-'}</TableCell>
      <TableCell>
        <Badge variant={user.is_active ? 'default' : 'secondary'}>
          {user.is_active ? 'Ativo' : 'Inativo'}
        </Badge>
      </TableCell>
      <TableCell>
        <div className="flex gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onEditUser(user)}
            disabled={!canManageUser(user)}
            title="Editar usuário"
          >
            <Edit className="h-4 w-4" />
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={handleToggleStatus}
            disabled={!canManageUser(user) || user.id === currentUserId}
            title={user.is_active ? 'Desativar usuário' : 'Ativar usuário'}
            className={user.is_active ? 'text-orange-600 hover:text-orange-800' : 'text-green-600 hover:text-green-800'}
          >
            {user.is_active ? <UserX className="h-4 w-4" /> : <UserCheck className="h-4 w-4" />}
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={handleDeleteUser}
            disabled={user.id === currentUserId || !canManageUser(user)}
            title="Excluir usuário permanentemente"
            className="text-red-600 hover:text-red-800"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </TableCell>
    </TableRow>
  );
};
