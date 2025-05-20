
import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import UserManagement from "@/components/Settings/UserManagement";
import CompanyData from "@/components/Settings/CompanyData";
import VisualCustomization from "@/components/Settings/VisualCustomization";
import CustomSystemParameters from "@/components/Settings/CustomSystemParameters";

const SettingsPage = () => {
  const [activeTab, setActiveTab] = useState('users');

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Configurações</h1>
        <p className="text-muted-foreground">Gerencie as configurações do sistema.</p>
      </div>

      <Tabs defaultValue="users" value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid grid-cols-2 md:grid-cols-4 w-full mb-6">
          <TabsTrigger value="users">Gestão de Usuários</TabsTrigger>
          <TabsTrigger value="company">Dados da Empresa</TabsTrigger>
          <TabsTrigger value="visual">Customização Visual</TabsTrigger>
          <TabsTrigger value="parameters">Parâmetros do Sistema</TabsTrigger>
        </TabsList>
        
        <TabsContent value="users" className="mt-2">
          <UserManagement />
        </TabsContent>
        
        <TabsContent value="company" className="mt-2">
          <CompanyData />
        </TabsContent>
        
        <TabsContent value="visual" className="mt-2">
          <VisualCustomization />
        </TabsContent>
        
        <TabsContent value="parameters" className="mt-2">
          <CustomSystemParameters />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SettingsPage;
