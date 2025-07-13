
import React from 'react';
import { TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Building, Users, User, FileText, Settings, Shield } from 'lucide-react';
import { AccessibleTabsList } from '@/components/Auth/TabAccessCheck';
import { useAuth } from '@/components/Auth/AuthProvider';

interface SettingsPageTabsProps {
  isAdmin: boolean;
  moduleRoute: string;
}

export const SettingsPageTabs: React.FC<SettingsPageTabsProps> = ({ isAdmin, moduleRoute }) => {
  const { userRole } = useAuth();
  
  console.log('SettingsPageTabs rendered:', { isAdmin, userRole, moduleRoute });
  
  // Se for admin ou master, mostrar todas as abas diretamente
  if (isAdmin || userRole === 'admin' || userRole === 'master') {
    console.log('Rendering admin tabs directly');
    return (
      <TabsList className="grid w-full grid-cols-5">
        <TabsTrigger value="company" className="flex items-center gap-2">
          <Building className="h-4 w-4" />
          Empresa
        </TabsTrigger>
        <TabsTrigger value="users" className="flex items-center gap-2">
          <Users className="h-4 w-4" />
          Usuários
        </TabsTrigger>
        <TabsTrigger value="system" className="flex items-center gap-2">
          <Settings className="h-4 w-4" />
          Sistema
        </TabsTrigger>
        <TabsTrigger value="fiscal" className="flex items-center gap-2">
          <FileText className="h-4 w-4" />
          Fiscal
        </TabsTrigger>
        <TabsTrigger value="security" className="flex items-center gap-2">
          <Shield className="h-4 w-4" />
          Segurança
        </TabsTrigger>
      </TabsList>
    );
  }

  // Para usuários normais, usar o sistema de controle de acesso
  console.log('Rendering normal user tabs with AccessibleTabsList');
  return (
    <AccessibleTabsList moduleRoute={moduleRoute} className="grid w-full grid-cols-5">
      <TabsTrigger value="company" className="flex items-center gap-2">
        <Building className="h-4 w-4" />
        Empresa
      </TabsTrigger>
      <TabsTrigger value="users" className="flex items-center gap-2">
        <Users className="h-4 w-4" />
        Usuários
      </TabsTrigger>
      <TabsTrigger value="system" className="flex items-center gap-2">
        <Settings className="h-4 w-4" />
        Sistema
      </TabsTrigger>
      <TabsTrigger value="fiscal" className="flex items-center gap-2">
        <FileText className="h-4 w-4" />
        Fiscal
      </TabsTrigger>
      <TabsTrigger value="security" className="flex items-center gap-2">
        <Shield className="h-4 w-4" />
        Segurança
      </TabsTrigger>
    </AccessibleTabsList>
  );
};
