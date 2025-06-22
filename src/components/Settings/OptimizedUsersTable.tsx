
import React from 'react';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MoreHorizontal, Edit, Trash2, User, UserCheck, UserX } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { LoadingSkeleton } from '@/components/ui/loading-skeleton';
import { OptimizedUser } from '@/hooks/useOptimizedUserData';

interface OptimizedUsersTableProps {
  users: OptimizedUser[];
  loading: boolean;
  currentUserId?: string;
  userRole?: string;
  onEditUser: (user: OptimizedUser) => void;
  onDeleteUser: (userId: string, userName: string, userEmail: string) => void;
  onStatusChange: (userId: string, isActive: boolean) => void;
}

export const OptimizedUsersTable: React.FC<OptimizedUsersTableProps> = ({
  users,
  loading,
  currentUserId,
  userRole,
  onEditUser,
  onDeleteUser,
  onStatusChange,
}) => {
  const canManageUsers = userRole === 'master' || userRole === 'admin';

  if (loading) {
    return (
      <div className="rounded-md border">
        <LoadingSkeleton type="table" rows={5} className="p-4" />
      </div>
    );
  }

  if (users.length === 0) {
    return (
      <div 
        className="text-center p-8 border rounded-lg"
        role="status"
        aria-live="polite"
      >
        <User className="h-12 w-12 mx-auto text-gray-400 mb-4" aria-hidden="true" />
        <p className="text-lg font-medium text-gray-900">Nenhum usuário encontrado</p>
        <p className="text-gray-500">Comece criando o primeiro usuário do sistema.</p>
      </div>
    );
  }

  return (
    <div className="rounded-md border" role="region" aria-label="Tabela de usuários">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nome</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Cargo</TableHead>
            <TableHead>Perfil de Acesso</TableHead>
            <TableHead>Status</TableHead>
            {canManageUsers && (
              <TableHead className="text-right">
                <span className="sr-only">Ações</span>
                Ações
              </TableHead>
            )}
          </TableRow>
        </TableHeader>
        <TableBody>
          {users.map((user) => {
            const isCurrentUser = user.id === currentUserId;
            const canEditThisUser = canManageUsers && (
              userRole === 'master' || 
              (userRole === 'admin' && user.role !== 'master')
            );

            return (
              <TableRow key={user.id}>
                <TableCell className="font-medium">
                  <div className="flex items-center gap-2">
                    {user.is_active ? (
                      <UserCheck className="h-4 w-4 text-green-600" aria-label="Usuário ativo" />
                    ) : (
                      <UserX className="h-4 w-4 text-red-600" aria-label="Usuário inativo" />
                    )}
                    <span>
                      {user.first_name} {user.last_name}
                      {isCurrentUser && (
                        <span className="text-xs text-blue-600 ml-2">(Você)</span>
                      )}
                    </span>
                  </div>
                </TableCell>
                <TableCell>{user.email}</TableCell>
                <TableCell>
                  <div>
                    <div className="font-medium">{user.position || 'Não definido'}</div>
                    <div className="text-sm text-gray-500">{user.department || 'Sem departamento'}</div>
                  </div>
                </TableCell>
                <TableCell>
                  {user.access_profile ? (
                    <Badge variant="outline" title={user.access_profile.description}>
                      {user.access_profile.name}
                    </Badge>
                  ) : (
                    <span className="text-sm text-gray-500">Sem perfil</span>
                  )}
                </TableCell>
                <TableCell>
                  <Badge 
                    variant={user.is_active ? "default" : "destructive"}
                    className={user.is_active ? "bg-green-100 text-green-800" : ""}
                  >
                    {user.is_active ? 'Ativo' : 'Inativo'}
                  </Badge>
                </TableCell>
                {canManageUsers && (
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button 
                          variant="ghost" 
                          className="h-8 w-8 p-0"
                          aria-label={`Ações para ${user.first_name} ${user.last_name}`}
                        >
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Ações</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        
                        {canEditThisUser && (
                          <DropdownMenuItem onClick={() => onEditUser(user)}>
                            <Edit className="mr-2 h-4 w-4" />
                            Editar
                          </DropdownMenuItem>
                        )}
                        
                        {canEditThisUser && !isCurrentUser && (
                          <DropdownMenuItem 
                            onClick={() => onStatusChange(user.id, !user.is_active)}
                          >
                            {user.is_active ? (
                              <>
                                <UserX className="mr-2 h-4 w-4" />
                                Desativar
                              </>
                            ) : (
                              <>
                                <UserCheck className="mr-2 h-4 w-4" />
                                Ativar
                              </>
                            )}
                          </DropdownMenuItem>
                        )}
                        
                        {canEditThisUser && !isCurrentUser && (
                          <>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem 
                              onClick={() => onDeleteUser(user.id, `${user.first_name} ${user.last_name}`, user.email)}
                              className="text-red-600"
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Excluir
                            </DropdownMenuItem>
                          </>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                )}
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
};
