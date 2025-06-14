import React, { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from '@/components/Auth/AuthProvider';
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Building, Users, BarChart3, CreditCard } from 'lucide-react';
import { SaasDashboard } from '@/components/Saas/SaasDashboard';
import { CompanySettingsForm } from '@/components/Saas/CompanySettingsForm';
import { useSaasCompanyManagement } from '@/hooks/useSaasCompanyManagement';
import { Button } from "@/components/ui/button";
import { SaasCompaniesTab } from "@/components/Saas/SaasCompaniesTab";
import { SaasPageHeader } from "@/components/Saas/SaasPageHeader";

const SaasPage = () => {
  const { userRole } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');
  const { companies, loading, loadCompanies } = useSaasCompanyManagement();
  const [companySettingsOpen, setCompanySettingsOpen] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState<any>(null);

  useEffect(() => {
    loadCompanies();
  }, []);

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
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="dashboard" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" /> Dashboard
          </TabsTrigger>
          <TabsTrigger value="companies" className="flex items-center gap-2">
            <Building className="h-4 w-4" /> Empresas
          </TabsTrigger>
          <TabsTrigger value="company-settings" className="flex items-center gap-2">
            <Building className="h-4 w-4" /> Configurações
          </TabsTrigger>
          <TabsTrigger value="plans" className="flex items-center gap-2">
            <CreditCard className="h-4 w-4" /> Planos
          </TabsTrigger>
          <TabsTrigger value="subscriptions" className="flex items-center gap-2">
            <Users className="h-4 w-4" /> Assinaturas
          </TabsTrigger>
          <TabsTrigger value="analytics" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" /> Analytics
          </TabsTrigger>
        </TabsList>
        <TabsContent value="dashboard">
          <SaasDashboard />
        </TabsContent>
        <TabsContent value="companies">
          <SaasCompaniesTab
            companies={companies}
            loading={loading}
            companySettingsOpen={companySettingsOpen}
            setCompanySettingsOpen={setCompanySettingsOpen}
            onConfig={(company) => {
              setSelectedCompany(company);
              setActiveTab("company-settings");
            }}
          />
        </TabsContent>
        <TabsContent value="company-settings">
          {selectedCompany ? (
            <CompanySettingsForm company={selectedCompany} refresh={loadCompanies} />
          ) : (
            <div>Selecione uma empresa em "Empresas" para editar as configurações.</div>
          )}
        </TabsContent>
        <TabsContent value="plans">
          <div>Gestão de Planos (refatore futuramente para boa prática)</div>
        </TabsContent>
        <TabsContent value="subscriptions">
          <div>Gestão de Assinaturas (refatore futuramente para boa prática)</div>
        </TabsContent>
        <TabsContent value="analytics">
          <div>Analytics SaaS (refatore futuramente para boa prática)</div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SaasPage;
