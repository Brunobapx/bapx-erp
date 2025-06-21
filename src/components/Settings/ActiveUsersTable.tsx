
import React from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Edit } from 'lucide-react';
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
  };
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
  onStatusChange: (userId: string, isActive: boolean) => void;
  onProfileChange: (userId: string, profileId: string) => void;
  loading?: boolean;
}

const ActiveUsersTable: React.FC<Props> = ({
  users, availableProfiles, userRole, onStatusChange, onProfileChange, loading = false
}) => {
  if (loading) {
    return (
      <div className="space-y-4">
        <h4 className="text-md font-medium">Usuários Ativos</h4>
        <div className="space-y-2">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h4 className="text-md font-medium">Usuários Ativos</h4>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nome</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Perfil</TableHead>
            <TableHead>Departamento</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {users.length === 0 ? (
            <TableRow>
              <TableCell colSpan={6} className="text-center text-gray-500">
                Nenhum usuário ativo encontrado
              </TableCell>
            </TableRow>
          ) : (
            users.map((user) => (
              <TableRow key={user.id}>
                <TableCell>
                  {user.first_name || user.last_name ? 
                    `${user.first_name} ${user.last_name}`.trim() : 
                    'Nome não informado'
                  }
                </TableCell>
                <TableCell>{user.email || 'Email não disponível'}</TableCell>
                <TableCell>
                  <Select
                    value={user.profile_id || ''}
                    disabled={userRole !== 'master' && user.role === 'master'}
                    onValueChange={profileId => onProfileChange(user.id, profileId)}
                  >
                    <SelectTrigger className="w-40">
                      <SelectValue placeholder="Selecionar perfil">
                        {user.access_profile?.name || 'Sem perfil'}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {availableProfiles.map(profile => (
                        <SelectItem value={profile.id} key={profile.id}>
                          {profile.name}
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
                    <Button variant="ghost" size="sm">
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onStatusChange(user.id, !user.is_active)}
                    >
                      {user.is_active ? 'Desativar' : 'Ativar'}
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
};

export default ActiveUsersTable;
