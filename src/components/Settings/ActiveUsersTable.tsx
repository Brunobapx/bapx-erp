
import React from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Edit, Trash2 } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface UserProfile {
  id: string;
  first_name: string;
  last_name: string;
  phone: string;
  department: string;
  position: string;
  is_active: boolean;
  last_login: string;
  role: string;
  email?: string;
  profile_id?: string;
  access_profile?: {
    name: string;
    description: string;
  } | null;
}

interface AccessProfile {
  id: string;
  name: string;
  description: string;
  is_active: boolean;
}

interface Props {
  users: UserProfile[];
  availableProfiles: AccessProfile[];
  userRole: string;
  currentUserId?: string;
  onStatusChange: (userId: string, isActive: boolean) => void;
  onProfileChange: (userId: string, profileId: string) => void;
  onDeleteUser: (userId: string, userName: string, userEmail: string) => void;
  loading?: boolean;
}

const NO_PROFILE_VALUE = '__no_profile__';

const ActiveUsersTable: React.FC<Props> = ({
  users, 
  availableProfiles, 
  userRole, 
  currentUserId,
  onStatusChange, 
  onProfileChange, 
  onDeleteUser,
  loading = false
}) => {
  if (loading) {
    return (
      <div className="space-y-4">
        <h4 className="text-md font-medium">Usuários do Sistema</h4>
        <div className="space-y-2">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
        </div>
      </div>
    );
  }

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
    // Se for o valor especial "sem perfil", converter para string vazia para o backend
    const actualProfileId = profileId === NO_PROFILE_VALUE ? '' : profileId;
    onProfileChange(userId, actualProfileId);
  };

  const canManageUser = (user: UserProfile) => {
    // Master pode gerenciar todos
    if (userRole === 'master') return true;
    
    // Admin não pode gerenciar master
    if (userRole === 'admin' && user.role === 'master') return false;
    
    // Admin pode gerenciar outros
    if (userRole === 'admin') return true;
    
    // Outros não podem gerenciar ninguém
    return false;
  };

  console.log('Available profiles in table:', availableProfiles);
  console.log('Users in table:', users);

  return (
    <div className="space-y-4">
      <h4 className="text-md font-medium">Usuários do Sistema</h4>
      {users.length === 0 && !loading ? (
        <div className="text-center py-8 text-gray-500">
          <p>Nenhum usuário encontrado para esta empresa.</p>
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Perfil de Acesso</TableHead>
              <TableHead>Departamento</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((user) => (
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
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
};

export default ActiveUsersTable;
