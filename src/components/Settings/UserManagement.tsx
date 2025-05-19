
import React, { useState } from 'react';
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
import { Search, Plus, Edit, Trash2, User } from 'lucide-react';

// Mock user data
const mockUsers = [
  { 
    id: 1, 
    name: 'Administrador', 
    email: 'admin@example.com', 
    role: 'Admin',
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
      configuracoes: true,
    }
  },
  { 
    id: 2, 
    name: 'João Silva', 
    email: 'joao@example.com', 
    role: 'Gerente',
    permissions: {
      pedidos: true,
      producao: true,
      embalagem: true,
      vendas: true,
      financeiro: true,
      rotas: false,
      calendario: true,
      clientes: true,
      produtos: true,
      fornecedores: true,
      emissao_fiscal: false,
      configuracoes: false,
    }
  },
  { 
    id: 3, 
    name: 'Maria Santos', 
    email: 'maria@example.com', 
    role: 'Operador',
    permissions: {
      pedidos: true,
      producao: true,
      embalagem: true,
      vendas: false,
      financeiro: false,
      rotas: false,
      calendario: true,
      clientes: false,
      produtos: true,
      fornecedores: false,
      emissao_fiscal: false,
      configuracoes: false,
    }
  },
];

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

const UserManagement = () => {
  const [users, setUsers] = useState(mockUsers);
  const [searchQuery, setSearchQuery] = useState('');
  const [isUserDialogOpen, setIsUserDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [editMode, setEditMode] = useState(false);

  // Filtered users based on search
  const filteredUsers = users.filter(user => 
    user.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.role.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleAddEditUser = () => {
    if (editMode && currentUser) {
      // Update existing user
      setUsers(users.map(user => user.id === currentUser.id ? currentUser : user));
      toast.success(`Usuário ${currentUser.name} atualizado com sucesso`);
    } else {
      // Add new user
      const newUser = {
        ...currentUser,
        id: users.length + 1,
      };
      setUsers([...users, newUser]);
      toast.success(`Usuário ${newUser.name} criado com sucesso`);
    }
    handleCloseDialog();
  };

  const handleDeleteUser = () => {
    if (currentUser) {
      setUsers(users.filter(user => user.id !== currentUser.id));
      toast.success(`Usuário ${currentUser.name} excluído com sucesso`);
      setIsDeleteDialogOpen(false);
    }
  };

  const handleOpenNewUserDialog = () => {
    setCurrentUser({
      name: '',
      email: '',
      role: '',
      permissions: modules.reduce((acc, module) => {
        acc[module.id] = false;
        return acc;
      }, {} as Record<string, boolean>)
    });
    setEditMode(false);
    setIsUserDialogOpen(true);
  };

  const handleOpenEditUserDialog = (user: any) => {
    setCurrentUser({...user});
    setEditMode(true);
    setIsUserDialogOpen(true);
  };

  const handleOpenDeleteDialog = (user: any) => {
    setCurrentUser(user);
    setIsDeleteDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsUserDialogOpen(false);
    setCurrentUser(null);
  };

  const handlePermissionChange = (moduleId: string, checked: boolean) => {
    if (currentUser) {
      setCurrentUser({
        ...currentUser,
        permissions: {
          ...currentUser.permissions,
          [moduleId]: checked
        }
      });
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <CardTitle className="text-xl">Gestão de Usuários</CardTitle>
          <Button onClick={handleOpenNewUserDialog}>
            <Plus className="mr-2 h-4 w-4" /> Novo Usuário
          </Button>
        </div>
        <CardDescription>
          Gerencie os usuários do sistema e suas permissões de acesso.
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

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>E-mail</TableHead>
                <TableHead>Função</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.map((user) => (
                <TableRow key={user.id}>
                  <TableCell className="font-medium">{user.name}</TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>{user.role}</TableCell>
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
              ))}
              {filteredUsers.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-4">
                    Nenhum usuário encontrado.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        {/* User Add/Edit Dialog */}
        <Dialog open={isUserDialogOpen} onOpenChange={setIsUserDialogOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>{editMode ? 'Editar Usuário' : 'Novo Usuário'}</DialogTitle>
              <DialogDescription>
                {editMode ? 'Edite as informações do usuário e suas permissões.' : 'Adicione um novo usuário ao sistema.'}
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="name">Nome</Label>
                <Input 
                  id="name" 
                  value={currentUser?.name || ''} 
                  onChange={(e) => setCurrentUser({...currentUser, name: e.target.value})}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="email">E-mail</Label>
                <Input 
                  id="email" 
                  type="email" 
                  value={currentUser?.email || ''} 
                  onChange={(e) => setCurrentUser({...currentUser, email: e.target.value})}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="role">Função</Label>
                <Input 
                  id="role" 
                  value={currentUser?.role || ''} 
                  onChange={(e) => setCurrentUser({...currentUser, role: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label>Permissões de Acesso</Label>
                <div className="grid grid-cols-2 gap-2">
                  {modules.map((module) => (
                    <div key={module.id} className="flex items-center space-x-2">
                      <Checkbox 
                        id={`permission-${module.id}`} 
                        checked={currentUser?.permissions?.[module.id] || false}
                        onCheckedChange={(checked) => handlePermissionChange(module.id, checked as boolean)}
                      />
                      <Label htmlFor={`permission-${module.id}`}>{module.name}</Label>
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
                {editMode ? 'Salvar' : 'Adicionar'}
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
                Tem certeza que deseja excluir o usuário {currentUser?.name}? Esta ação não poderá ser desfeita.
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
