
import React from 'react';
import { Button } from "@/components/ui/button";
import { Plus, RefreshCw } from 'lucide-react';

interface UserManagementHeaderProps {
  usersCount: number;
  loading: boolean;
  onRefresh: () => void;
  onNewUser: () => void;
}

export const UserManagementHeader: React.FC<UserManagementHeaderProps> = ({
  usersCount,
  loading,
  onRefresh,
  onNewUser,
}) => {
  return (
    <div className="flex justify-between items-center mb-6">
      <div>
        <h3 className="text-lg font-medium">Gerenciamento de Usuários</h3>
        <p className="text-sm text-gray-600">
          Gerencie usuários, permissões e perfis de acesso ({usersCount} usuários)
        </p>
      </div>
      <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={onRefresh}
          disabled={loading}
          className="flex items-center gap-2"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Atualizar
        </Button>
        <Button
          onClick={onNewUser}
          size="sm"
          className="flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          Novo Usuário
        </Button>
      </div>
    </div>
  );
};
