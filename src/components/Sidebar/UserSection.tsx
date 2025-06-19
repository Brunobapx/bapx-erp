
import React from 'react';
import { Button } from "@/components/ui/button";
import { LogOut, User, Building2 } from 'lucide-react';
import { useAuth } from '../Auth/AuthProvider';

export const UserSection = () => {
  const { user, signOut, userRole, companyInfo } = useAuth();

  if (!user) return null;

  return (
    <div className="p-4 border-t border-border mt-auto">
      {/* Informações da empresa */}
      {companyInfo && (
        <div className="mb-3 p-2 bg-muted/50 rounded-md">
          <div className="flex items-center gap-2">
            <Building2 className="h-3 w-3 text-muted-foreground" />
            <span className="text-xs font-medium text-muted-foreground">
              {companyInfo.name}
            </span>
          </div>
        </div>
      )}
      
      <div className="flex items-center gap-3 mb-3">
        <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-full flex items-center justify-center">
          <User className="h-4 w-4 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate">{user.email}</p>
          {userRole && (
            <p className="text-xs text-muted-foreground capitalize">
              {userRole === 'admin' ? 'Administrador' : userRole}
            </p>
          )}
        </div>
      </div>
      <Button
        onClick={signOut}
        variant="outline"
        size="sm"
        className="w-full"
      >
        <LogOut className="h-4 w-4 mr-2" />
        Sair
      </Button>
    </div>
  );
};
