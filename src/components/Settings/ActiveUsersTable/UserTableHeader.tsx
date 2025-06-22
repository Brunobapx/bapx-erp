
import React from 'react';
import { TableHead, TableHeader, TableRow } from "@/components/ui/table";

export const UserTableHeader: React.FC = () => {
  return (
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
  );
};
