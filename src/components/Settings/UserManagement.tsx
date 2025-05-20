
import React, { useState, useEffect } from 'react';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle 
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { Search, Plus, Edit, Trash2, Shield } from 'lucide-react';
import { supabase } from "@/integrations/supabase/client";

// Define interface for permissions
interface UserPermissions {
  pedidos: boolean;
  producao: boolean;
  embalagem: boolean;
  vendas: boolean;
  financeiro: boolean;
  rotas: boolean;
  calendario: boolean;
  clientes: boolean;
  produtos: boolean;
  fornecedores: boolean;
  emissao_fiscal: boolean;
  configuracoes: boolean;
}

// Define interface for user
interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  permissions: UserPermissions;
  isAdmin: boolean;
}

// Define module permissions
const modules = [
  { id: 'pedidos', name: 'Pedidos' },
  { id: 'producao', name: 'Produção' },
  { id: 'embalagem', name: 'Embalagem' },
  { id: 'vendas', name: 'Vendas' },
  { id: 'financeiro', name: 'Financeiro' },
  { id: 'rotas', name: 'Rotas' },
  { id: 'calendario', name: 'Calendário' },
  { id: 'clientes', name: 'Clientes' },
  { id: 'produtos', name: 'Produtos' },
  { id: 'fornecedores', name: 'Fornecedores' },
  { id: 'emissao_fiscal', name: 'Emissão Fiscal' },
  { id: 'configuracoes', name: 'Configurações' },
];

interface UserManagementProps {
  currentUser: { email: string } | null;
}

const UserManagement = ({ currentUser }: UserManagementProps) => {
  const [users, setUsers] = useState<User[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isUserDialogOpen, setIsUserDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [currentSelectedUser, setCurrentSelectedUser] = useState<User | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [loading, setLoading] = useState(true);

  // Carregar usuários do Supabase
  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      // Primeiro, buscar todos os usuários com suas permissões
      const { data: profiles, error } = await supabase
        .from('profiles')
        .select('*');

      if (error) throw error;

      if (profiles) {
        // Transformar os perfis em nosso formato de usuário
        const mappedUsers: User[] = profiles.map(profile => ({
          id: profile.id,
          name: `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || 'Usuário sem nome',
          email: '',  // Email não está disponível diretamente do profiles
          role: profile.role || 'user',
          isAdmin: profile.role === 'admin',
          permissions: {
            pedidos: true,
            producao: true,
            embalagem: true,
            vendas: true,
            financeiro: true,
            rotas: true,
            calendario: true,
            clientes: true,
            produtos: true,
            fornecedores: true,
            emissao_fiscal: true,
            configuracoes: profile.role === 'admin'
          }
        }));

        setUsers(mappedUsers);
      }
    } catch (error) {
      console.error('Erro ao carregar usuários:', error);
      toast.error("Erro ao carregar usuários");
    } finally {
      setLoading(false);
    }
  };

  // Filtered users based on search
  const filteredUsers = users.filter(user => 
    user.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.role.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleAddEditUser = async () => {
    if (!currentSelectedUser) return;
    
    try {
      if (editMode) {
        // Update existing user in database
        const { error } = await supabase
          .from('profiles')
          .update({
            first_name: currentSelectedUser.name.split(' ')[0] || '',
            last_name: currentSelectedUser.name.split(' ').slice(1).join(' ') || '',
            role: currentSelectedUser.isAdmin ? 'admin' : 'user'
          })
          .eq('id', currentSelectedUser.id);
          
        if (error) throw error;
        
        // Update user in local state
        setUsers(users.map(user => user.id === currentSelectedUser.id ? currentSelectedUser : user));
        toast.success(`Usuário ${currentSelectedUser.name} atualizado com sucesso`);
      } else {
        // Adding new user is more complicated and would require Supabase Auth
        toast.info("Para adicionar novos usuários, eles precisam se registrar no sistema primeiro");
      }
    } catch (error) {
      console.error('Erro ao salvar usuário:', error);
      toast.error("Erro ao salvar usuário");
    } finally {
      handleCloseDialog();
    }
  };

  const handleDeleteUser = async () => {
    if (currentSelectedUser) {
      try {
        // Não permitir excluir o próprio usuário atual
        if (currentUser && currentSelectedUser.email === currentUser.email) {
          toast.error("Você não pode excluir seu próprio usuário");
          return;
        }

        // Note: In a real system, we'd need to delete the Auth user as well
        const { error } = await supabase
          .from('profiles')
          .delete()
          .eq('id', currentSelectedUser.id);
          
        if (error) throw error;
        
        setUsers(users.filter(user => user.id !== currentSelectedUser.id));
        toast.success(`Usuário ${currentSelectedUser.name} excluído com sucesso`);
      } catch (error) {
        console.error('Erro ao excluir usuário:', error);
        toast.error("Erro ao excluir usuário");
      } finally {
        setIsDeleteDialogOpen(false);
      }
    }
  };

  const handleOpenEditUserDialog = (user: User) => {
    setCurrentSelectedUser({...user});
    setEditMode(true);
    setIsUserDialogOpen(true);
  };

  const handleOpenDeleteDialog = (user: User) => {
    setCurrentSelectedUser(user);
    setIsDeleteDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsUserDialogOpen(false);
    setCurrentSelectedUser(null);
  };

  const handleToggleAdmin = async (user: User) => {
    try {
      // Não permitir remover privilégios de administrador do próprio usuário
      if (currentUser && user.email === currentUser.email && user.isAdmin) {
        toast.error("Você não pode remover seus próprios privilégios de administrador");
        return;
      }
      
      const updatedUser = { ...user, isAdmin: !user.isAdmin, role: !user.isAdmin ? 'admin' : 'user' };
      
      // Atualizar no banco de dados
      const { error } = await supabase
        .from('profiles')
        .update({ role: updatedUser.role })
        .eq('id', user.id);
        
      if (error) throw error;
      
      // Atualizar na interface
      setUsers(users.map(u => u.id === user.id ? updatedUser : u));
      
      const action = updatedUser.isAdmin ? "concedidos" : "removidos";
      toast.success(`Privilégios de administrador ${action} para ${user.name}`);
    } catch (error) {
      console.error('Erro ao alterar privilégios de administrador:', error);
      toast.error("Erro ao alterar privilégios de administrador");
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <CardTitle className="text-xl">Gestão de Usuários</CardTitle>
          <Button onClick={() => toast.info("Para adicionar novos usuários, eles precisam se registrar no sistema primeiro")}>
            <Plus className="mr-2 h-4 w-4" /> Novo Usuário
          </Button>
        </div>
        <CardDescription>
          Gerencie os usuários do sistema e suas permissões de acesso. Administradores têm acesso completo ao sistema.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="relative w-full md:max-w-sm">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar usuários..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8"
            />
          </div>

          {loading ? (
            <div className="text-center py-4">Carregando usuários...</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Função</TableHead>
                  <TableHead>Admin</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.length > 0 ? (
                  filteredUsers.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium">{user.name}</TableCell>
                      <TableCell>{user.role}</TableCell>
                      <TableCell>
                        <Button 
                          variant={user.isAdmin ? "default" : "outline"} 
                          size="sm"
                          onClick={() => handleToggleAdmin(user)}
                          className={user.isAdmin ? "bg-green-600 hover:bg-green-700" : ""}
                        >
                          <Shield className="h-4 w-4 mr-1" />
                          {user.isAdmin ? "Sim" : "Não"}
                        </Button>
                      </TableCell>
                      <TableCell className="text-right flex gap-2 justify-end">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => handleOpenEditUserDialog(user)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => handleOpenDeleteDialog(user)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-4">
                      Nenhum usuário encontrado.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </div>

        {/* User Edit Dialog */}
        <Dialog open={isUserDialogOpen} onOpenChange={setIsUserDialogOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Editar Usuário</DialogTitle>
              <DialogDescription>
                Edite as informações do usuário e defina-o como administrador para conceder acesso total.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="name">Nome</Label>
                <Input 
                  id="name" 
                  value={currentSelectedUser?.name || ''} 
                  onChange={(e) => currentSelectedUser && setCurrentSelectedUser({...currentSelectedUser, name: e.target.value})}
                />
              </div>
              
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="is-admin" 
                  checked={currentSelectedUser?.isAdmin || false}
                  onCheckedChange={(checked) => currentSelectedUser && setCurrentSelectedUser({
                    ...currentSelectedUser, 
                    isAdmin: checked === true,
                    role: checked === true ? 'admin' : 'user'
                  })}
                />
                <Label htmlFor="is-admin">Administrador do sistema (acesso completo)</Label>
              </div>
              
              <div className="space-y-2">
                <Label>Módulos acessíveis para usuários não-administradores</Label>
                <div className="grid grid-cols-2 gap-2">
                  {modules.map((module) => (
                    <div key={module.id} className="flex items-center space-x-2">
                      <Checkbox 
                        id={`permission-${module.id}`} 
                        checked={currentSelectedUser?.permissions?.[module.id as keyof UserPermissions] || false}
                        disabled={module.id === 'configuracoes' || !currentSelectedUser || currentSelectedUser.isAdmin}
                        onCheckedChange={(checked) => {
                          if (!currentSelectedUser || currentSelectedUser.isAdmin) return;
                          
                          setCurrentSelectedUser({
                            ...currentSelectedUser,
                            permissions: {
                              ...currentSelectedUser.permissions,
                              [module.id as keyof UserPermissions]: checked === true
                            }
                          });
                        }}
                      />
                      <Label 
                        htmlFor={`permission-${module.id}`}
                        className={module.id === 'configuracoes' ? "text-muted-foreground" : ""}
                      >
                        {module.name}
                        {module.id === 'configuracoes' && " (apenas admin)"}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={handleCloseDialog}>
                Cancelar
              </Button>
              <Button onClick={handleAddEditUser}>
                Salvar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Excluir Usuário</DialogTitle>
              <DialogDescription>
                Tem certeza que deseja excluir o usuário {currentSelectedUser?.name}? Esta ação não poderá ser desfeita.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
                Cancelar
              </Button>
              <Button variant="destructive" onClick={handleDeleteUser}>
                Excluir
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
};

export default UserManagement;
