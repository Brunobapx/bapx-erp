
import React, { useCallback } from 'react';
import { useCompanyUsers } from '@/hooks/useCompanyUsers';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import CreateUserModal from '@/components/Settings/CreateUserModal';

interface Props {
  companyId: string;
  onUserCreated?: () => void;
}

export const CompanyUsersModalContent: React.FC<Props> = ({ companyId, onUserCreated }) => {
  const { data: users, isLoading, error, refetch } = useCompanyUsers(companyId);
  const [isCreateUserModalOpen, setIsCreateUserModalOpen] = React.useState(false);

  const handleUserCreated = useCallback(() => {
    setIsCreateUserModalOpen(false);
    refetch();
    if (onUserCreated) onUserCreated();
  }, [onUserCreated, refetch]);

  if (isLoading) {
    return (
      <div className="space-y-2">
        <Skeleton className="h-8 w-full" />
        <Skeleton className="h-8 w-full" />
        <Skeleton className="h-8 w-full" />
      </div>
    );
  }

  if (error) {
    return <p className="text-destructive">Erro ao carregar usuários: {error.message}</p>;
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h4 className="font-medium">Usuários desta empresa</h4>
        <button
          className="bg-primary text-white px-3 py-1 rounded hover:bg-primary/90"
          onClick={() => setIsCreateUserModalOpen(true)}
        >
          Novo Usuário
        </button>
        <CreateUserModal
          open={isCreateUserModalOpen}
          setOpen={setIsCreateUserModalOpen}
          onSuccess={handleUserCreated}
          availableRoles={[
            { value: 'user', label: 'Usuário' },
            { value: 'admin', label: 'Administrador' },
            { value: 'master', label: 'Master', masterOnly: true },
            { value: 'vendedor', label: 'Vendedor' },
            { value: 'administrativo', label: 'Administrativo' },
            { value: 'financeiro', label: 'Financeiro' },
            { value: 'producao', label: 'Produção' },
            { value: 'embalagem', label: 'Embalagem' },
            { value: 'entrega', label: 'Entrega' }
          ]}
          userRole="master" // Acesso master administrativo aqui (pode melhorar pegando do contexto)
        />
      </div>
      {(!users || users.length === 0) ? (
        <p>Nenhum usuário encontrado para esta empresa.</p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Função</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((user) => (
              <TableRow key={user.id}>
                <TableCell>{user.first_name} {user.last_name}</TableCell>
                <TableCell>{user.email}</TableCell>
                <TableCell>{user.role}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
};
