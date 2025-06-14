
import React from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Trash2 } from 'lucide-react';

interface UserInvitation {
  id: string;
  email: string;
  role: string;
  status: string;
  expires_at: string;
  created_at: string;
}

interface Props {
  invitations: UserInvitation[];
  onDelete: (invitationId: string) => void;
}

const getStatusBadge = (status: string) => {
  if (status === 'pending') {
    return <Badge variant="outline">Pendente</Badge>;
  } else if (status === 'accepted') {
    return <Badge variant="default">Aceito</Badge>;
  } else {
    return <Badge variant="destructive">Expirado</Badge>;
  }
};

const UserInvitationsTable: React.FC<Props> = ({ invitations, onDelete }) => (
  <div className="space-y-4">
    <h4 className="text-md font-medium">Convites Pendentes</h4>
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Email</TableHead>
          <TableHead>Função</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Expira em</TableHead>
          <TableHead>Ações</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {invitations.map((invitation) => (
          <TableRow key={invitation.id}>
            <TableCell>{invitation.email}</TableCell>
            <TableCell className="capitalize">{invitation.role}</TableCell>
            <TableCell>{getStatusBadge(invitation.status)}</TableCell>
            <TableCell>
              {new Date(invitation.expires_at).toLocaleDateString('pt-BR')}
            </TableCell>
            <TableCell>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onDelete(invitation.id)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  </div>
);

export default UserInvitationsTable;
