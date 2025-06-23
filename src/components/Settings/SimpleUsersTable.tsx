
import React from 'react';
import { Table, TableBody, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { SimpleUser } from '@/hooks/useUserData';
import { UserTableRow } from './UserTable/UserTableRow';

interface Props {
  users: SimpleUser[];
  userRole: string;
  currentUserId?: string;
  onStatusChange: (userId: string, isActive: boolean) => void;
  onRoleChange: (userId: string, role: string) => void;
  onProfileChange: (userId: string, profileId: string) => void;
  onDeleteUser: (userId: string, userName: string) => void;
  onEditUser: (user: SimpleUser) => void;
  loading?: boolean;
  availableProfiles?: Array<{id: string; name: string; description: string; is_active: boolean}>;
}

const SimpleUsersTable: React.FC<Props> = ({
  users, 
  userRole, 
  currentUserId,
  onStatusChange, 
  onRoleChange, 
  onProfileChange,
  onDeleteUser,
  onEditUser,
  loading = false,
  availableProfiles = []
}) => {
  
  console.log('SimpleUsersTable render:', { 
    usersCount: users?.length, 
    loading, 
    userRole, 
    profilesCount: availableProfiles?.length 
  });
  
  const safeUsers = Array.isArray(users) ? users : [];

  if (loading && safeUsers.length === 0) {
    return (
      <div className="text-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
        <p>Carregando usuários...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h4 className="text-md font-medium">Lista de Usuários ({safeUsers.length})</h4>
      
      {safeUsers.length === 0 ? (
        <div className="text-center py-8 text-gray-500 border rounded-lg">
          <p>Nenhum usuário encontrado.</p>
          <p className="text-sm mt-1">Clique em "Novo Usuário" para adicionar o primeiro usuário.</p>
        </div>
      ) : (
        <div className="rounded-md border">
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
              {safeUsers.map((user) => (
                <UserTableRow
                  key={user.id}
                  user={user}
                  userRole={userRole}
                  currentUserId={currentUserId}
                  onStatusChange={onStatusChange}
                  onRoleChange={onRoleChange}
                  onProfileChange={onProfileChange}
                  onDeleteUser={onDeleteUser}
                  onEditUser={onEditUser}
                  availableProfiles={availableProfiles}
                />
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
};

export default SimpleUsersTable;
