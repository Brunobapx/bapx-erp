
import React from 'react';
import { TabsContent } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CompanyUnifiedSettings } from '@/components/Settings/CompanyUnifiedSettings';
import { CompanyManagement } from '@/components/Settings/CompanyManagement';
import { UserManagement } from '@/components/Settings/UserManagement';
import { CurrentUserProfile } from '@/components/Settings/CurrentUserProfile';
import { DatabaseReset } from '@/components/Settings/DatabaseReset';
import { SellerCommissionsSection } from '@/components/Settings/SellerCommissionsSection';
import { WhiteLabelSettings } from '@/components/Settings/WhiteLabelSettings';

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
    <TabContent tabName="Empresa & Fiscal">
      <CompanyUnifiedSettings />
    </TabContent>
  )}
</TabsContent>

      {isAdmin && (
        <>
          <TabsContent value="management">
            <TabContent tabName="Gerenciamento da Empresa">
              <CompanyManagement />
            </TabContent>
          </TabsContent>

          <TabsContent value="whitelabel">
            <TabContent tabName="White Label">
              <WhiteLabelSettings />
            </TabContent>
          </TabsContent>
          
          <TabsContent value="users">
            <TabContent tabName="Usuários">
              <div className="space-y-6">
                <UserManagement />
                <SellerCommissionsSection />
                <DatabaseReset />
              </div>
            </TabContent>
          </TabsContent>
        </>
      )}
    </>
  );
};
