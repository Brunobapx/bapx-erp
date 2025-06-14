
import React from 'react';
import { useCompanyUsers } from '@/hooks/useCompanyUsers';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';

interface Props {
  companyId: string;
}

export const CompanyUsersModalContent: React.FC<Props> = ({ companyId }) => {
  const { data: users, isLoading, error } = useCompanyUsers(companyId);

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

  if (!users || users.length === 0) {
    return <p>Nenhum usuário encontrado para esta empresa.</p>;
  }

  return (
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
  );
};
