import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Plus, Trash2, Users, Edit } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useUserManagement } from '@/hooks/useUserManagement';
import { POSITION_LABELS, UserPosition } from '@/hooks/useUserPositions';
import { CreateUserModal } from './CreateUserModal';
import { EditUserModal } from './EditUserModal';
import { useAuth } from '@/components/Auth/AuthProvider';
import type { User as UserType } from '@/hooks/useUserManagement';

export const UserManagement = () => {
  const { users, loading, refetch, updateUser, deleteUser } = useUserManagement();
  const { refreshUserData } = useAuth();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserType | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [userPositions, setUserPositions] = useState<Record<string, UserPosition>>({});

  // Buscar cargos dos usuários
  const fetchUserPositions = async () => {
    try {
      const userIds = users.map(user => user.id);
      if (userIds.length === 0) return;

      const { data, error } = await supabase
        .from('user_positions')
        .select('user_id, position')
        .in('user_id', userIds);

      if (!error && data) {
        const positionsMap = data.reduce((acc, item) => {
          acc[item.user_id] = item.position;
          return acc;
        }, {} as Record<string, UserPosition>);
        setUserPositions(positionsMap);
      }
    } catch (error) {
      console.error('Error fetching user positions:', error);
    }
  };

  const handleCreateSuccess = () => {
    refetch();
    refreshUserData();
  };

  const handleDelete = async (userId: string, userEmail: string) => {
    if (window.confirm(`Tem certeza que deseja remover o usuário ${userEmail}?`)) {
      await deleteUser(userId);
    }
  };

  const handleEdit = (user: UserType) => {
    setEditingUser(user);
    setIsEditModalOpen(true);
  };

  const handleEditSuccess = () => {
    setEditingUser(null);
    setIsEditModalOpen(false);
    refetch();
    refreshUserData();
    fetchUserPositions();
  };

  // Buscar cargos quando os usuários mudarem
  React.useEffect(() => {
    if (users.length > 0) {
      fetchUserPositions();
    }
  }, [users]);

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case 'master': return 'default';
      case 'admin': return 'secondary';
      default: return 'outline';
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'master': return 'Master';
      case 'admin': return 'Administrador';
      default: return 'Usuário';
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Gerenciamento de Usuários
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center p-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
            <p>Carregando usuários...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Gerenciamento de Usuários
              </CardTitle>
              <CardDescription>
                Gerencie os usuários do sistema e suas permissões de acesso aos módulos.
              </CardDescription>
            </div>
            <Button onClick={() => setIsCreateModalOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Novo Usuário
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {users.length === 0 ? (
            <div className="text-center p-8 text-muted-foreground">
              <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Nenhum usuário encontrado</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Usuário</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Cargo</TableHead>
                  <TableHead>Módulos</TableHead>
                  <TableHead>Criado em</TableHead>
                  <TableHead className="w-[150px]">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={user.user_metadata.avatar_url} />
                          <AvatarFallback>
                            {user.user_metadata.first_name?.charAt(0)}
                            {user.user_metadata.last_name?.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">
                            {user.user_metadata.first_name} {user.user_metadata.last_name}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {user.id.slice(0, 8)}...
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>
                      <Badge variant={getRoleBadgeVariant(user.role || 'user')}>
                        {getRoleLabel(user.role || 'user')}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {userPositions[user.id] ? (
                        <Badge variant="outline">
                          {POSITION_LABELS[userPositions[user.id]]}
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground text-sm">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {['admin', 'master'].includes(user.role || '') ? (
                          <Badge variant="outline" className="text-xs">
                            Todos os módulos
                          </Badge>
                        ) : (
                          user.modules?.slice(0, 2).map((module, index) => (
                            <Badge key={index} variant="outline" className="text-xs">
                              {module}
                            </Badge>
                          ))
                        )}
                        {user.role === 'user' && user.modules && user.modules.length > 2 && (
                          <Badge variant="outline" className="text-xs">
                            +{user.modules.length - 2}
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {new Date(user.created_at).toLocaleDateString('pt-BR')}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(user)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(user.id, user.email)}
                          className="text-destructive hover:text-destructive"
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
        </CardContent>
      </Card>

      <CreateUserModal
        open={isCreateModalOpen}
        onOpenChange={setIsCreateModalOpen}
        onSuccess={handleCreateSuccess}
      />

      <EditUserModal
        open={isEditModalOpen}
        onOpenChange={setIsEditModalOpen}
        user={editingUser}
        onSuccess={handleEditSuccess}
      />
    </>
  );
};