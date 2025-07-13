
import React from 'react';
import { TabsContent } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CompanySettings } from '@/components/Settings/CompanySettings';
import { UserManagement } from '@/components/Settings/UserManagement';
import { CurrentUserProfile } from '@/components/Settings/CurrentUserProfile';
import { DatabaseReset } from '@/components/Settings/DatabaseReset';
import { FiscalSettings } from '@/components/Settings/FiscalSettings';
import { CompanyFiscalInfo } from '@/components/Settings/CompanyFiscalInfo';
import { SellerCommissionsSection } from '@/components/Settings/SellerCommissionsSection';
import { SystemSettings } from '@/components/Settings/SystemSettings';
import { SecuritySettings } from '@/components/Settings/SecuritySettings';

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
      <TabsContent value="company">
        <TabContent tabName="Empresa">
          <CompanySettings />
        </TabContent>
      </TabsContent>

      <TabsContent value="users">
        <TabContent tabName="Usuários">
          <div className="space-y-6">
            <UserManagement />
            <SellerCommissionsSection />
          </div>
        </TabContent>
      </TabsContent>

      <TabsContent value="system">
        <TabContent tabName="Sistema">
          <div className="space-y-6">
            <SystemSettings />
            <DatabaseReset />
          </div>
        </TabContent>
      </TabsContent>

      <TabsContent value="fiscal">
        <TabContent tabName="Fiscal">
          <div className="space-y-6">
            <CompanyFiscalInfo />
            <FiscalSettings />
          </div>
        </TabContent>
      </TabsContent>

      <TabsContent value="security">
        <TabContent tabName="Segurança">
          <SecuritySettings />
        </TabContent>
      </TabsContent>
    </>
  );
};
