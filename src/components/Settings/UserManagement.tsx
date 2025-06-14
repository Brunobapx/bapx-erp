import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { UserPlus, Mail, Edit, Trash2, RefreshCw } from 'lucide-react';
import { z } from 'zod';
import { useAuth } from '@/components/Auth/AuthProvider';

// Input validation schemas
const emailSchema = z.string().email('Email inválido');

interface UserInvitation {
  id: string;
  email: string;
  role: string;
  status: string;
  expires_at: string;
  created_at: string;
}

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

export const UserManagement = () => {
  const [invitations, setInvitations] = useState<UserInvitation[]>([]);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('user');
  const [loading, setLoading] = useState(false);
  const [validationErrors, setValidationErrors] = useState<{ email?: string }>({});
  const { toast } = useToast();
  const { userRole } = useAuth();

  // Lista de roles disponíveis
  const availableRoles = [
    { value: 'user', label: 'Usuário' },
    { value: 'admin', label: 'Administrador' },
    { value: 'master', label: 'Master', masterOnly: true },
    { value: 'vendedor', label: 'Vendedor' },
    { value: 'administrativo', label: 'Administrativo' },
    { value: 'financeiro', label: 'Financeiro' },
    { value: 'producao', label: 'Produção' },
    { value: 'embalagem', label: 'Embalagem' },
    { value: 'entrega', label: 'Entrega' }
  ];

  // Security check - only admins and masters can access this component
  if (userRole !== 'admin' && userRole !== 'master') {
    return (
      <div className="text-center p-4">
        <p className="text-red-500">Acesso negado. Apenas administradores podem gerenciar usuários.</p>
      </div>
    );
  }

  const loadInvitations = async () => {
    try {
      const { data, error } = await supabase
        .from('user_invitations')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      setInvitations(data || []);
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Erro ao carregar convites:', error);
      }
    }
  };

  const loadUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select(`
          *,
          user_roles!inner(role)
        `)
        .eq('is_active', true);
      
      if (error) throw error;
      
      const usersWithRoles = data?.map(user => ({
        ...user,
        role: user.user_roles?.[0]?.role || 'user'
      })) || [];
      
      setUsers(usersWithRoles);
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Erro ao carregar usuários:', error);
      }
    }
  };

  useEffect(() => {
    loadInvitations();
    loadUsers();
  }, []);

  const validateEmail = (email: string) => {
    try {
      emailSchema.parse(email);
      setValidationErrors({});
      return true;
    } catch (error) {
      if (error instanceof z.ZodError) {
        setValidationErrors({ email: error.errors[0]?.message });
      }
      return false;
    }
  };

  const sendInvitation = async () => {
    if (!validateEmail(inviteEmail.trim())) {
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from('user_invitations')
        .insert({
          email: inviteEmail.trim(),
          role: inviteRole,
          invited_by: (await supabase.auth.getUser()).data.user?.id
        });

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Convite enviado com sucesso!",
      });

      setInviteEmail('');
      setInviteRole('user');
      setIsInviteModalOpen(false);
      loadInvitations();
    } catch (error: any) {
      toast({
        title: "Erro",
        description: "Erro ao enviar convite",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const deleteInvitation = async (invitationId: string) => {
    if (!confirm('Tem certeza que deseja remover este convite?')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('user_invitations')
        .delete()
        .eq('id', invitationId);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Convite removido com sucesso!",
      });

      loadInvitations();
    } catch (error: any) {
      toast({
        title: "Erro",
        description: "Erro ao remover convite",
        variant: "destructive",
      });
    }
  };

  const updateUserStatus = async (userId: string, isActive: boolean) => {
    if (!confirm(`Tem certeza que deseja ${isActive ? 'ativar' : 'desativar'} este usuário?`)) {
      return;
    }

    try {
      const { error } = await supabase
        .from('profiles')
        .update({ is_active: isActive })
        .eq('id', userId);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: `Usuário ${isActive ? 'ativado' : 'desativado'} com sucesso!`,
      });

      loadUsers();
    } catch (error: any) {
      toast({
        title: "Erro",
        description: "Erro ao atualizar usuário",
        variant: "destructive",
      });
    }
  };

  const updateUserRole = async (userId: string, newRole: string) => {
    // Only masters can assign master role
    if (newRole === 'master' && userRole !== 'master') {
      toast({
        title: "Erro",
        description: "Apenas usuários master podem atribuir a função master",
        variant: "destructive",
      });
      return;
    }

    if (!confirm('Tem certeza que deseja alterar a função deste usuário?')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('user_roles')
        .update({ role: newRole })
        .eq('user_id', userId);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Função do usuário atualizada com sucesso!",
      });

      loadUsers();
    } catch (error: any) {
      toast({
        title: "Erro",
        description: "Erro ao atualizar função",
        variant: "destructive",
      });
    }
  };

  const getStatusBadge = (status: string) => {
    if (status === 'pending') {
      return <Badge variant="outline">Pendente</Badge>;
    } else if (status === 'accepted') {
      return <Badge variant="default">Aceito</Badge>;
    } else {
      return <Badge variant="destructive">Expirado</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Usuários do Sistema</h3>
        <Dialog open={isInviteModalOpen} onOpenChange={setIsInviteModalOpen}>
          <DialogTrigger asChild>
            <Button>
              <UserPlus className="h-4 w-4 mr-2" />
              Convidar Usuário
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Convidar Novo Usuário</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="usuario@email.com"
                  className={validationErrors.email ? 'border-red-500' : ''}
                />
                {validationErrors.email && (
                  <p className="text-sm text-red-500">{validationErrors.email}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="role">Função</Label>
                <Select value={inviteRole} onValueChange={setInviteRole}>
                  <SelectTrigger>
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
              </div>
              <Button onClick={sendInvitation} disabled={loading} className="w-full">
                {loading ? (
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Mail className="h-4 w-4 mr-2" />
                )}
                Enviar Convite
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Convites Pendentes */}
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
                    onClick={() => deleteInvitation(invitation.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Usuários Ativos */}
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
                  {/* EDITAR ROLE EM DROP DOWN */}
                  <Select
                    value={user.role}
                    disabled={userRole !== 'master' && user.role === 'master'}
                    onValueChange={newRole => updateUserRole(user.id, newRole)}
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
                      onClick={() => updateUserStatus(user.id, !user.is_active)}
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
    </div>
  );
};
