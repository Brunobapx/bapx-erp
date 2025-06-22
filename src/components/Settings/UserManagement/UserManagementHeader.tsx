
import React from 'react';
import { Button } from "@/components/ui/button";
import { RefreshCw, Plus, Users } from 'lucide-react';

interface UserManagementHeaderProps {
  usersCount: number;
  loading: boolean;
  onRefresh: () => void;
  onNewUser: () => void;
  canCreateUsers?: boolean;
}

export const UserManagementHeader: React.FC<UserManagementHeaderProps> = ({
  usersCount,
  loading,
  onRefresh,
  onNewUser,
  canCreateUsers = true,
}) => {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-3">
        <Users className="h-6 w-6 text-primary" />
        <div>
          <h2 className="text-2xl font-bold">Gerenciamento de Usuários</h2>
          <p className="text-sm text-muted-foreground">
            {usersCount} usuário{usersCount !== 1 ? 's' : ''} encontrado{usersCount !== 1 ? 's' : ''}
          </p>
        </div>
      </div>
      
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={onRefresh}
          disabled={loading}
          className="gap-2"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Atualizar
        </Button>
        
        {canCreateUsers && (
          <Button
            onClick={onNewUser}
            disabled={loading}
            className="gap-2"
          >
            <Plus className="h-4 w-4" />
            Novo Usuário
          </Button>
        )}
      </div>
    </div>
  );
};
