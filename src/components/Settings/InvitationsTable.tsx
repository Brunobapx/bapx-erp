import React from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useInvitations, type Invitation } from '@/hooks/useInvitations';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export const InvitationsTable: React.FC = () => {
  const { invitations, loading, cancelInvitation, resendInvitation } = useInvitations();

  const getStatusBadge = (status: string, expiresAt: string) => {
    const isExpired = new Date(expiresAt) < new Date();
    
    if (status === 'accepted') {
      return <Badge variant="default" className="bg-green-100 text-green-800">Aceito</Badge>;
    }
    if (status === 'cancelled') {
      return <Badge variant="secondary">Cancelado</Badge>;
    }
    if (isExpired) {
      return <Badge variant="destructive">Expirado</Badge>;
    }
    
    return <Badge variant="outline">Pendente</Badge>;
  };

  const getRoleBadge = (role: string) => {
    const roleMap = {
      'admin': 'Administrador',
      'user': 'Usuário',
      'master': 'Master'
    };
    
    return roleMap[role as keyof typeof roleMap] || role;
  };

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
        <p>Carregando convites...</p>
      </div>
    );
  }

  if (invitations.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <p>Nenhum convite encontrado.</p>
        <p className="text-sm mt-1">Clique em "Convidar Usuário" para enviar o primeiro convite.</p>
      </div>
    );
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Email</TableHead>
            <TableHead>Função</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Expira em</TableHead>
            <TableHead>Enviado</TableHead>
            <TableHead>Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {invitations.map((invitation) => {
            const isExpired = new Date(invitation.expires_at) < new Date();
            const isPending = invitation.status === 'pending' && !isExpired;
            
            return (
              <TableRow key={invitation.id}>
                <TableCell className="font-medium">{invitation.email}</TableCell>
                <TableCell>{getRoleBadge(invitation.role)}</TableCell>
                <TableCell>{getStatusBadge(invitation.status, invitation.expires_at)}</TableCell>
                <TableCell>
                  {isExpired ? (
                    <span className="text-destructive">Expirado</span>
                  ) : (
                    formatDistanceToNow(new Date(invitation.expires_at), {
                      addSuffix: true,
                      locale: ptBR
                    })
                  )}
                </TableCell>
                <TableCell>
                  {formatDistanceToNow(new Date(invitation.created_at), {
                    addSuffix: true,
                    locale: ptBR
                  })}
                </TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    {isPending && (
                      <>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => resendInvitation(invitation.id)}
                        >
                          Reenviar
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => cancelInvitation(invitation.id)}
                        >
                          Cancelar
                        </Button>
                      </>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
};