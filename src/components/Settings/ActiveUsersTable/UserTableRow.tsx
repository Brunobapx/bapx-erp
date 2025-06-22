
import React from 'react';
import { TableCell, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Edit, Trash2 } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { UserProfile, AccessProfile } from './types';

interface UserTableRowProps {
  user: UserProfile;
  availableProfiles: AccessProfile[];
  userRole: string;
  currentUserId?: string;
  onStatusChange: (userId: string, isActive: boolean) => void;
  onProfileChange: (userId: string, profileId: string) => void;
  onDeleteUser: (userId: string, userName: string, userEmail: string) => void;
}

const NO_PROFILE_VALUE = '__no_profile__';

export const UserTableRow: React.FC<UserTableRowProps> = ({
  user,
  availableProfiles,
  userRole,
  currentUserId,
  onStatusChange,
  onProfileChange,
  onDeleteUser,
}) => {
  const getDisplayName = (user: UserProfile) => {
    const fullName = `${user.first_name || ''} ${user.last_name || ''}`.trim();
    return fullName || user.email || 'Nome não informado';
  };

  const getProfileDisplayName = (user: UserProfile) => {
    if (user.access_profile?.name) {
      return user.access_profile.name;
    }
    return 'Sem perfil';
  };

  const getCurrentProfileId = (user: UserProfile) => {
    return user.profile_id || NO_PROFILE_VALUE;
  };

  const handleProfileChange = (userId: string, profileId: string) => {
    const actualProfileId = profileId === NO_PROFILE_VALUE ? '' : profileId;
    onProfileChange(userId, actualProfileId);
  };

  const canManageUser = (user: UserProfile) => {
    if (userRole === 'master') return true;
    if (userRole === 'admin' && user.role === 'master') return false;
    if (userRole === 'admin') return true;
    return false;
  };

  return (
    <TableRow key={user.id}>
      <TableCell className="font-medium">{getDisplayName(user)}</TableCell>
      <TableCell>{user.email || 'Email não disponível'}</TableCell>
      <TableCell>
        <Select
          value={getCurrentProfileId(user)}
          disabled={!canManageUser(user)}
          onValueChange={(profileId) => handleProfileChange(user.id, profileId)}
        >
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Selecionar perfil">
              {getProfileDisplayName(user)}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={NO_PROFILE_VALUE}>Sem perfil</SelectItem>
            {availableProfiles
              .filter(profile => profile.is_active)
              .map(profile => (
                <SelectItem value={profile.id} key={profile.id}>
                  {profile.name} - {profile.description}
                </SelectItem>
              ))}
          </SelectContent>
        </Select>
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
            title="Editar usuário"
            disabled={!canManageUser(user)}
          >
            <Edit className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onStatusChange(user.id, !user.is_active)}
            disabled={!canManageUser(user)}
            title={user.is_active ? 'Desativar usuário' : 'Ativar usuário'}
          >
            {user.is_active ? 'Desativar' : 'Ativar'}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onDeleteUser(
              user.id, 
              getDisplayName(user),
              user.email || ''
            )}
            disabled={
              user.id === currentUserId || 
              !canManageUser(user)
            }
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
