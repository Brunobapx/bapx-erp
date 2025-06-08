
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { UserManagement } from '@/components/Settings/UserManagement';
import { ProfileManagement } from '@/components/Settings/ProfileManagement';
import { SystemSettings } from '@/components/Settings/SystemSettings';
import { CompanySettings } from '@/components/Settings/CompanySettings';
import { SecuritySettings } from '@/components/Settings/SecuritySettings';
import { useAuth } from '@/components/Auth/AuthProvider';
import { useCompanyContext } from '@/components/Auth/CompanyProvider';
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Settings, Users, User, Building, Shield } from 'lucide-react';

const SettingsPage = () => {
  const { userRole } = useAuth();
  const { company } = useCompanyContext();
  const [activeTab, setActiveTab] = useState('profile');

  const isMaster = userRole === 'master';
  const isAdmin = userRole === 'admin' || userRole === 'master';

  if (!company) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center">
          <p className="text-gray-500">Carregando configurações...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <Settings className="h-8 w-8 text-primary" />
        <div>
          <h1 className="text-3xl font-bold">Configurações</h1>
          <p className="text-gray-600">{company.name}</p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="profile" className="flex items-center gap-2">
            <User className="h-4 w-4" />
            Perfil
          </TabsTrigger>
          <TabsTrigger value="company" className="flex items-center gap-2" disabled={!isAdmin}>
            <Building className="h-4 w-4" />
            Empresa
          </TabsTrigger>
          <TabsTrigger value="users" className="flex items-center gap-2" disabled={!isAdmin}>
            <Users className="h-4 w-4" />
            Usuários
          </TabsTrigger>
          <TabsTrigger value="system" className="flex items-center gap-2" disabled={!isMaster}>
            <Settings className="h-4 w-4" />
            Sistema
          </TabsTrigger>
          <TabsTrigger value="security" className="flex items-center gap-2" disabled={!isMaster}>
            <Shield className="h-4 w-4" />
            Segurança
          </TabsTrigger>
        </TabsList>

        <TabsContent value="profile">
          <ProfileManagement />
        </TabsContent>

        <TabsContent value="company">
          {!isAdmin ? (
            <Alert>
              <AlertDescription>
                Você não tem permissão para acessar esta seção. Acesso restrito a administradores.
              </AlertDescription>
            </Alert>
          ) : (
            <CompanySettings />
          )}
        </TabsContent>

        <TabsContent value="users">
          {!isAdmin ? (
            <Alert>
              <AlertDescription>
                Você não tem permissão para acessar esta seção. Acesso restrito a administradores.
              </AlertDescription>
            </Alert>
          ) : (
            <UserManagement />
          )}
        </TabsContent>

        <TabsContent value="system">
          {!isMaster ? (
            <Alert>
              <AlertDescription>
                Você não tem permissão para acessar esta seção. Acesso restrito a usuários master.
              </AlertDescription>
            </Alert>
          ) : (
            <SystemSettings />
          )}
        </TabsContent>

        <TabsContent value="security">
          {!isMaster ? (
            <Alert>
              <AlertDescription>
                Você não tem permissão para acessar esta seção. Acesso restrito a usuários master.
              </AlertDescription>
            </Alert>
          ) : (
            <SecuritySettings />
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SettingsPage;
