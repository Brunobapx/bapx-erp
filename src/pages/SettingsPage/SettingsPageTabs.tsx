
import React from 'react';
import { TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Building, Users } from 'lucide-react';

interface SettingsPageTabsProps {
  isAdmin: boolean;
}

export const SettingsPageTabs: React.FC<SettingsPageTabsProps> = ({ isAdmin }) => {
  return (
    <TabsList className={`grid w-full ${isAdmin ? 'grid-cols-2' : 'grid-cols-1'}`}>
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
