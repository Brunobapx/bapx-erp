
import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { UserManagement } from '@/components/Settings/UserManagement';
import { ProfileManagement } from '@/components/Settings/ProfileManagement';
import { ProfilesManagement } from '@/components/Settings/ProfilesManagement';
import { CompanySettings } from '@/components/Settings/CompanySettings';
import { useAuth } from '@/components/Auth/AuthProvider';
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Users, User, Building, Settings as SettingsIcon, Shield } from 'lucide-react';

const SettingsPage = () => {
  const { userRole, companyInfo } = useAuth();
  const [activeTab, setActiveTab] = useState('profile');

  const isAdmin = userRole === 'admin' || userRole === 'master';

  console.log('SettingsPage rendered, userRole:', userRole, 'isAdmin:', isAdmin, 'companyInfo:', companyInfo?.id);

  // Show loading if still getting auth info
  if (!userRole || !companyInfo) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex items-center gap-3 mb-6">
          <SettingsIcon className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold">Configurações</h1>
        </div>
        <div className="text-center p-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
          <p>Carregando configurações...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <SettingsIcon className="h-8 w-8 text-primary" />
        <h1 className="text-3xl font-bold">Configurações</h1>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="profile" className="flex items-center gap-2">
            <User className="h-4 w-4" />
            Perfil
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

        <TabsContent value="profile">
          <div className="bg-white rounded-lg border p-6">
            <ProfileManagement />
          </div>
        </TabsContent>

        <TabsContent value="users">
          {!isAdmin ? (
            <Alert>
              <AlertDescription>
                Você não tem permissão para acessar esta seção. Acesso restrito a administradores.
              </AlertDescription>
            </Alert>
          ) : (
            <div className="bg-white rounded-lg border p-6">
              <UserManagement />
            </div>
          )}
        </TabsContent>

        <TabsContent value="profiles">
          {!isAdmin ? (
            <Alert>
              <AlertDescription>
                Você não tem permissão para acessar esta seção. Acesso restrito a administradores.
              </AlertDescription>
            </Alert>
          ) : (
            <div className="bg-white rounded-lg border p-6">
              <ProfilesManagement />
            </div>
          )}
        </TabsContent>

        <TabsContent value="company">
          {!isAdmin ? (
            <Alert>
              <AlertDescription>
                Você não tem permissão para acessar esta seção. Acesso restrito a administradores.
              </AlertDescription>
            </Alert>
          ) : (
            <div className="bg-white rounded-lg border p-6">
              <CompanySettings />
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SettingsPage;
