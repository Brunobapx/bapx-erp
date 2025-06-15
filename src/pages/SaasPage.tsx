import React, { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from '@/components/Auth/AuthProvider';
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Building, Users, BarChart3, CreditCard, Package, Settings, Puzzle
} from 'lucide-react';
import { SaasDashboard } from '@/components/Saas/SaasDashboard';
import { CompanySettingsForm } from '@/components/Saas/CompanySettingsForm';
import { useSaasCompanies } from '@/hooks/useSaasCompanies';
import { SaasCompaniesTab } from "@/components/Saas/SaasCompaniesTab";
import { SaasPageHeader } from "@/components/Saas/SaasPageHeader";
import { SaasPlansManagement } from "@/components/Saas/SaasPlansManagement";
import { SaasSubscriptionsManagement } from "@/components/Saas/SaasSubscriptionsManagement";
import { SaasAnalytics } from "@/components/Saas/SaasAnalytics";
import { SaasModulesManagement } from "@/components/Saas/SaasModulesManagement";
import { SaasPaymentsManagement } from "@/components/Saas/SaasPaymentsManagement";
import { CompanyUsersModal } from "@/components/Saas/CompanyActions/CompanyUsersModal";
import { useQueryClient } from '@tanstack/react-query';

const SaasPage = () => {
  const { userRole } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');
  const { data: companies, isLoading: loading, refetch: loadCompanies } = useSaasCompanies();
  const [companySettingsOpen, setCompanySettingsOpen] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState<any>(null);
  const [companyUsersModalCompany, setCompanyUsersModalCompany] = useState<any>(null);
  const queryClient = useQueryClient();

  useEffect(() => {
    loadCompanies();
  }, []);

  const handleUserCreated = () => {
    // Invalida a query global de usuários do sistema (caso react-query usado na listagem)
    queryClient.invalidateQueries({ queryKey: ['users-system'] });
    // Envia um evento global para avisar outros componentes (caso listagem usa efeito global)
    window.dispatchEvent(new Event('user-system-created'));
  };

  if (userRole !== 'master') {
    return (
      <div className="container mx-auto p-6">
        <Alert variant="destructive">
          <AlertDescription>
            Acesso negado. Esta área é exclusiva para usuários master.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <SaasPageHeader />
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-7">
          <TabsTrigger value="dashboard" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" /> Dashboard
          </TabsTrigger>
          <TabsTrigger value="companies" className="flex items-center gap-2">
            <Building className="h-4 w-4" /> Empresas
          </TabsTrigger>
          <TabsTrigger value="plans" className="flex items-center gap-2">
            <Package className="h-4 w-4" /> Planos
          </TabsTrigger>
          <TabsTrigger value="modules" className="flex items-center gap-2">
            <Puzzle className="h-4 w-4" /> Módulos
          </TabsTrigger>
          <TabsTrigger value="subscriptions" className="flex items-center gap-2">
            <CreditCard className="h-4 w-4" /> Assinaturas
          </TabsTrigger>
          <TabsTrigger value="payments" className="flex items-center gap-2">
            <CreditCard className="h-4 w-4" /> Pagamentos
          </TabsTrigger>
          <TabsTrigger value="analytics" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" /> Analytics
          </TabsTrigger>
        </TabsList>

        {/* Dashboard */}
        <TabsContent value="dashboard">
          <SaasDashboard />
        </TabsContent>
        {/* Empresas/Clientes */}
        <TabsContent value="companies">
          <SaasCompaniesTab
            companies={companies || []}
            loading={loading}
            onConfig={(company) => {
              setSelectedCompany(company);
              setActiveTab("company-settings");
            }}
          />
        </TabsContent>
        {/* Configurações da Empresa (acesso via Empresas) */}
        <TabsContent value="company-settings">
          {selectedCompany ? (
            <CompanySettingsForm company={selectedCompany} refresh={loadCompanies} />
          ) : (
            <div>Selecione uma empresa em "Empresas" para editar as configurações.</div>
          )}
        </TabsContent>
        {/* Modal de Usuários da Empresa */}
        <CompanyUsersModal
          company={companyUsersModalCompany}
          onOpenChange={(open) => setCompanyUsersModalCompany(open ? companyUsersModalCompany : null)}
          onUserCreated={handleUserCreated}
        />
        {/* Gestão de Planos */}
        <TabsContent value="plans">
          <SaasPlansManagement />
        </TabsContent>
        {/* Gestão de Módulos */}
        <TabsContent value="modules">
          <SaasModulesManagement />
        </TabsContent>
        {/* Gestão de Assinaturas */}
        <TabsContent value="subscriptions">
          <SaasSubscriptionsManagement />
        </TabsContent>
        {/* Controle de Pagamentos */}
        <TabsContent value="payments">
          <SaasPaymentsManagement />
        </TabsContent>
        {/* Analytics */}
        <TabsContent value="analytics">
          <SaasAnalytics />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SaasPage;
