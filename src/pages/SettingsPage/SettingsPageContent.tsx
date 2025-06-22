
import React from 'react';
import { TabsContent } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { UserManagement } from '@/components/Settings/UserManagement';
import { ProfileManagement } from '@/components/Settings/ProfileManagement';
import { ProfilesManagement } from '@/components/Settings/ProfilesManagement';
import { CompanySettings } from '@/components/Settings/CompanySettings';

interface TabContentProps {
  tabName: string;
  children: React.ReactNode;
}

const TabContent: React.FC<TabContentProps> = ({ tabName, children }) => {
  try {
    return (
      <div className="bg-white rounded-lg border p-6">
        {children}
      </div>
    );
  } catch (error) {
    console.error(`Error rendering ${tabName} tab:`, error);
    return (
      <Alert>
        <AlertDescription>
          Erro ao carregar a aba {tabName}. Tente recarregar a página.
        </AlertDescription>
      </Alert>
    );
  }
};

interface SettingsPageContentProps {
  isAdmin: boolean;
}

export const SettingsPageContent: React.FC<SettingsPageContentProps> = ({ isAdmin }) => {
  return (
    <>
      <TabsContent value="profile">
        <TabContent tabName="Perfil">
          <ProfileManagement />
        </TabContent>
      </TabsContent>

      <TabsContent value="users">
        {!isAdmin ? (
          <Alert>
            <AlertDescription>
              Você não tem permissão para acessar esta seção. Acesso restrito a administradores.
            </AlertDescription>
          </Alert>
        ) : (
          <TabContent tabName="Usuários">
            <UserManagement />
          </TabContent>
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
          <TabContent tabName="Perfis de Acesso">
            <ProfilesManagement />
          </TabContent>
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
          <TabContent tabName="Empresa">
            <CompanySettings />
          </TabContent>
        )}
      </TabsContent>
    </>
  );
};
