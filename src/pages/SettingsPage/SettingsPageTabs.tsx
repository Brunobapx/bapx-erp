
import React from 'react';
import { TabsList, TabsTrigger } from "@/components/ui/tabs";
import { User, Users, Building, Shield, Mail } from 'lucide-react';

interface SettingsPageTabsProps {
  isAdmin: boolean;
}

export const SettingsPageTabs: React.FC<SettingsPageTabsProps> = ({ isAdmin }) => {
  return (
    <TabsList className="grid w-full grid-cols-5">
      <TabsTrigger value="profile" className="flex items-center gap-2">
        <User className="h-4 w-4" />
        Perfil
      </TabsTrigger>
      <TabsTrigger value="invites" className="flex items-center gap-2" disabled={!isAdmin}>
        <Mail className="h-4 w-4" />
        Convites
      </TabsTrigger>
      <TabsTrigger value="users" className="flex items-center gap-2" disabled={!isAdmin}>
        <Users className="h-4 w-4" />
        Usuários
      </TabsTrigger>
      <TabsTrigger value="profiles" className="flex items-center gap-2" disabled={!isAdmin}>
        <Shield className="h-4 w-4" />
        Perfis de Acesso
      </TabsTrigger>
      <TabsTrigger value="company" className="flex items-center gap-2" disabled={!isAdmin}>
        <Building className="h-4 w-4" />
        Empresa
      </TabsTrigger>
    </TabsList>
  );
};
