
import React from 'react';
import { TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Building, Users, User } from 'lucide-react';

interface SettingsPageTabsProps {
  isAdmin: boolean;
}

export const SettingsPageTabs: React.FC<SettingsPageTabsProps> = ({ isAdmin }) => {
  const tabCount = isAdmin ? 3 : 2;
  
  return (
    <TabsList className={isAdmin ? "grid w-full grid-cols-3" : "grid w-full grid-cols-2"}>
      <TabsTrigger value="profile" className="flex items-center gap-2">
        <User className="h-4 w-4" />
        Meu Perfil
      </TabsTrigger>
      <TabsTrigger value="company" className="flex items-center gap-2">
        <Building className="h-4 w-4" />
        Empresa
      </TabsTrigger>
      {isAdmin && (
        <TabsTrigger value="users" className="flex items-center gap-2">
          <Users className="h-4 w-4" />
          Usuários
        </TabsTrigger>
      )}
    </TabsList>
  );
};
