
import React from 'react';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Search, Plus } from 'lucide-react';
import { useUserManagement } from './hooks/useUserManagement';
import UserDialog from './UserDialog';
import DeleteUserDialog from './DeleteUserDialog';
import UsersTable from './UsersTable';
import { User as SupabaseUser } from "@supabase/supabase-js";

interface UserManagementProps {
  currentUser: SupabaseUser | null;
}

const UserManagement = ({ currentUser }: UserManagementProps) => {
  const {
    users,
    searchQuery,
    setSearchQuery,
    isUserDialogOpen,
    isDeleteDialogOpen,
    currentSelectedUser,
    setCurrentSelectedUser,
    loading,
    handleAddEditUser,
    handleDeleteUser,
    handleOpenEditUserDialog,
    handleOpenDeleteDialog,
    handleCloseDialog,
    handleToggleAdmin,
    setIsUserDialogOpen,
    setIsDeleteDialogOpen
  } = useUserManagement(currentUser);

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
            <UsersTable 
              users={users}
              onEdit={handleOpenEditUserDialog}
              onDelete={handleOpenDeleteDialog}
              onToggleAdmin={handleToggleAdmin}
            />
          )}
        </div>

        {/* User Edit Dialog */}
        <UserDialog 
          isOpen={isUserDialogOpen}
          onClose={() => setIsUserDialogOpen(false)}
          user={currentSelectedUser}
          onSave={handleAddEditUser}
          setUser={setCurrentSelectedUser}
        />

        {/* Delete Confirmation Dialog */}
        <DeleteUserDialog 
          isOpen={isDeleteDialogOpen}
          onClose={() => setIsDeleteDialogOpen(false)}
          user={currentSelectedUser}
          onDelete={handleDeleteUser}
        />
      </CardContent>
    </Card>
  );
};

export default UserManagement;
