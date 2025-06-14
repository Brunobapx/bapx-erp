
import React from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
}

interface AvailableRole {
  value: string;
  label: string;
  masterOnly?: boolean;
}

interface Props {
  users: UserProfile[];
  availableRoles: AvailableRole[];
  userRole: string;
  onStatusChange: (userId: string, isActive: boolean) => void;
  onRoleChange: (userId: string, newRole: string) => void;
}

const ActiveUsersTable: React.FC<Props> = ({
  users, availableRoles, userRole, onStatusChange, onRoleChange
}) => (
  <div className="space-y-4">
    <h4 className="text-md font-medium">Usuários Ativos</h4>
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Nome</TableHead>
          <TableHead>Email</TableHead>
          <TableHead>Função</TableHead>
          <TableHead>Departamento</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Ações</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {users.map((user) => (
          <TableRow key={user.id}>
            <TableCell>
              {user.first_name} {user.last_name}
            </TableCell>
            <TableCell>{user.id}</TableCell>
            <TableCell className="capitalize">
              <Select
                value={user.role}
                disabled={userRole !== 'master' && user.role === 'master'}
                onValueChange={newRole => onRoleChange(user.id, newRole)}
              >
                <SelectTrigger className="capitalize w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {availableRoles.map(role =>
                    role.value === 'master' && userRole !== 'master' ? null : (
                      <SelectItem value={role.value} key={role.value}>
                        {role.label}
                      </SelectItem>
                    )
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
        ))}
      </TableBody>
    </Table>
  </div>
);

export default ActiveUsersTable;
