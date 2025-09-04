import React from 'react';
import { TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Building, Users, User, Palette, Settings, Store } from 'lucide-react';

interface SettingsPageTabsProps {
  isAdmin: boolean;
}

export const SettingsPageTabs: React.FC<SettingsPageTabsProps> = ({ isAdmin }) => {
  return (
    <TabsList className={isAdmin ? "grid w-full grid-cols-6" : "grid w-full grid-cols-3"}>
      <TabsTrigger value="profile" className="flex items-center gap-2">
        <User className="h-4 w-4" />
        Meu Perfil
      </TabsTrigger>
      <TabsTrigger value="company" className="flex items-center gap-2">
        <Building className="h-4 w-4" />
        Empresa & Fiscal
      </TabsTrigger>
      <TabsTrigger value="ecommerce" className="flex items-center gap-2">
        <Store className="h-4 w-4" />
        E-commerce
      </TabsTrigger>
      {isAdmin && (
        <>
          <TabsTrigger value="management" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Gerenciamento
          </TabsTrigger>
          <TabsTrigger value="whitelabel" className="flex items-center gap-2">
            <Palette className="h-4 w-4" />
            White Label
          </TabsTrigger>
          <TabsTrigger value="users" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Usuários
          </TabsTrigger>
        </>
      )}
    </TabsList>
  );
};
