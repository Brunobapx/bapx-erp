
import React from 'react';
import { TabsContent } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CompanySettings } from '@/components/Settings/CompanySettings';
import { UserManagement } from '@/components/Settings/UserManagement';
import { CurrentUserProfile } from '@/components/Settings/CurrentUserProfile';
import { DatabaseReset } from '@/components/Settings/DatabaseReset';
import { CompanyFiscalInfo } from '@/components/Settings/CompanyFiscalInfo';
import { SellerCommissionsSection } from '@/components/Settings/SellerCommissionsSection';

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
          <CurrentUserProfile />
        </TabContent>
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

      {isAdmin && (
        <TabsContent value="fiscal">
          <TabContent tabName="Fiscal">
            <CompanyFiscalInfo />
          </TabContent>
        </TabsContent>
      )}

      {isAdmin && (
        <TabsContent value="users">
          <TabContent tabName="Usuários">
            <div className="space-y-6">
              <UserManagement />
              <SellerCommissionsSection />
              <DatabaseReset />
            </div>
          </TabContent>
        </TabsContent>
      )}
    </>
  );
};
