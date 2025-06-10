
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from '@/components/Auth/AuthProvider';
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Building, Users, Settings, BarChart3, CreditCard } from 'lucide-react';
import { SaasDashboard } from '@/components/Saas/SaasDashboard';
import { SaasCompanyManagement } from '@/components/Saas/SaasCompanyManagement';
import { SaasPlansManagement } from '@/components/Saas/SaasPlansManagement';
import { SaasSubscriptionsManagement } from '@/components/Saas/SaasSubscriptionsManagement';
import { SaasAnalytics } from '@/components/Saas/SaasAnalytics';

const SaasPage = () => {
  const { userRole } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');

  // Verificar se é usuário master
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
            <BarChart3 className="h-4 w-4" />
            Dashboard
          </TabsTrigger>
          <TabsTrigger value="companies" className="flex items-center gap-2">
            <Building className="h-4 w-4" />
            Empresas
          </TabsTrigger>
          <TabsTrigger value="plans" className="flex items-center gap-2">
            <CreditCard className="h-4 w-4" />
            Planos
          </TabsTrigger>
          <TabsTrigger value="subscriptions" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Assinaturas
          </TabsTrigger>
          <TabsTrigger value="analytics" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Analytics
          </TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard">
          <SaasDashboard />
        </TabsContent>

        <TabsContent value="companies">
          <SaasCompanyManagement />
        </TabsContent>

        <TabsContent value="plans">
          <SaasPlansManagement />
        </TabsContent>

        <TabsContent value="subscriptions">
          <SaasSubscriptionsManagement />
        </TabsContent>

        <TabsContent value="analytics">
          <SaasAnalytics />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SaasPage;
