
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from '@/components/Auth/AuthProvider';
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Building, Users, BarChart3, CreditCard } from 'lucide-react';
import { SaasDashboard } from '@/components/Saas/SaasDashboard';
import { CompanyCreateModal } from '@/components/Saas/CompanyCreateModal';
import { CompanySettingsForm } from '@/components/Saas/CompanySettingsForm';
import { useSaasCompanyManagement } from '@/hooks/useSaasCompanyManagement';
// IMPORTAÇÃO CORRETA DO COMPONENTE BUTTON
import { Button } from "@/components/ui/button";

const SaasPage = () => {
  const { userRole } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');
  const { companies, loading, loadCompanies } = useSaasCompanyManagement();
  const [companySettingsOpen, setCompanySettingsOpen] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState<any>(null);

  useEffect(() => {
    loadCompanies();
  }, []);

  // Permissão master
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
      <div className="flex items-center gap-3 mb-6">
        <Building className="h-8 w-8 text-primary" />
        <h1 className="text-3xl font-bold">Gestão SaaS</h1>
      </div>
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
          <div className="flex justify-end mb-4">
            <CompanyCreateModal open={companySettingsOpen} setOpen={setCompanySettingsOpen} />
          </div>
          <Card>
            <CardHeader>
              <CardTitle>Empresas</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div>Carregando empresas...</div>
              ) : (
                <table className="min-w-full table-auto">
                  <thead>
                    <tr>
                      <th>Nome</th>
                      <th>Subdomínio</th>
                      <th>Email cobrança</th>
                      <th>Status</th>
                      <th>Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {companies.map((company: any) => (
                      <tr key={company.id}>
                        <td className="font-medium">{company.name}</td>
                        <td>{company.subdomain}</td>
                        <td>{company.billing_email || '-'}</td>
                        <td>{company.is_active ? "Ativa" : "Inativa"}</td>
                        <td>
                          <Button size="sm" variant="outline" onClick={() => { setSelectedCompany(company); setActiveTab("company-settings"); }}>
                            Configurar
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="company-settings">
          {selectedCompany ? (
            <CompanySettingsForm company={selectedCompany} refresh={loadCompanies} />
          ) : (
            <div>Selecione uma empresa em "Empresas" para editar as configurações.</div>
          )}
        </TabsContent>
        {/* Mantido: planos, assinaturas, analytics */}
        <TabsContent value="plans">
          {/* <SaasPlansManagement /> */}
          <div>Gestão de Planos (refatore futuramente para boa prática)</div>
        </TabsContent>
        <TabsContent value="subscriptions">
          {/* <SaasSubscriptionsManagement /> */}
          <div>Gestão de Assinaturas (refatore futuramente para boa prática)</div>
        </TabsContent>
        <TabsContent value="analytics">
          {/* <SaasAnalytics /> */}
          <div>Analytics SaaS (refatore futuramente para boa prática)</div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SaasPage;
