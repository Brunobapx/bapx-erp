
import React from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Trash2 } from 'lucide-react';
import { SimpleUser } from '@/hooks/useSimpleUserManagement';

interface Props {
  users: SimpleUser[];
  userRole: string;
  currentUserId?: string;
  onStatusChange: (userId: string, isActive: boolean) => void;
  onRoleChange: (userId: string, role: string) => void;
  onDeleteUser: (userId: string, userName: string) => void;
  loading?: boolean;
}

const SimpleUsersTable: React.FC<Props> = ({
  users, 
  userRole, 
  currentUserId,
  onStatusChange, 
  onRoleChange, 
  onDeleteUser,
  loading = false
}) => {
  const getDisplayName = (user: SimpleUser) => {
    const fullName = `${user.first_name || ''} ${user.last_name || ''}`.trim();
    return fullName || 'Nome não informado';
  };

  const canManageUser = (user: SimpleUser) => {
    if (userRole === 'master') return true;
    if (userRole === 'admin' && user.role !== 'master') return true;
    return false;
  };

  if (loading) {
    return <div className="text-center p-4">Carregando usuários...</div>;
  }

  return (
    <div className="space-y-4">
      <h4 className="text-md font-medium">Usuários do Sistema</h4>
      {users.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <p>Nenhum usuário encontrado.</p>
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Papel</TableHead>
              <TableHead>Departamento</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((user) => (
              <TableRow key={user.id}>
                <TableCell className="font-medium">{getDisplayName(user)}</TableCell>
                <TableCell>{user.email}</TableCell>
                <TableCell>
                  <Select
                    value={user.role}
                    disabled={!canManageUser(user)}
                    onValueChange={(role) => onRoleChange(user.id, role)}
                  >
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="user">Usuário</SelectItem>
                      <SelectItem value="admin">Admin</SelectItem>
                      {userRole === 'master' && (
                        <SelectItem value="master">Master</SelectItem>
                      )}
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
                      onClick={() => onStatusChange(user.id, !user.is_active)}
                      disabled={!canManageUser(user)}
                    >
                      {user.is_active ? 'Desativar' : 'Ativar'}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onDeleteUser(user.id, getDisplayName(user))}
                      disabled={user.id === currentUserId || !canManageUser(user)}
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

export default SimpleUsersTable;
