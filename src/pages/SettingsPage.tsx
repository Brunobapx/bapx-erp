
import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import UserManagement from '@/components/Settings/UserManagement';
import PermissionManagement from '@/components/Settings/PermissionManagement';
import LayoutCustomization from '@/components/Settings/LayoutCustomization';
import CompanyInfo from '@/components/Settings/CompanyInfo';
import SystemSettings from '@/components/Settings/SystemSettings';

const SettingsPage = () => {
  return (
    <div className="container p-6 mx-auto">
      <h1 className="text-3xl font-bold mb-6">Configurações do Sistema</h1>
      
      <Tabs defaultValue="users" className="w-full">
        <TabsList className="mb-6 flex flex-wrap">
          <TabsTrigger value="users">Usuários</TabsTrigger>
          <TabsTrigger value="permissions">Permissões</TabsTrigger>
          <TabsTrigger value="layout">Personalização</TabsTrigger>
          <TabsTrigger value="company">Dados da Empresa</TabsTrigger>
          <TabsTrigger value="system">Configurações do Sistema</TabsTrigger>
        </TabsList>
        
        <TabsContent value="users">
          <UserManagement />
        </TabsContent>
        
        <TabsContent value="permissions">
          <PermissionManagement />
        </TabsContent>
        
        <TabsContent value="layout">
          <LayoutCustomization />
        </TabsContent>
        
        <TabsContent value="company">
          <CompanyInfo />
        </TabsContent>
        
        <TabsContent value="system">
          <SystemSettings />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SettingsPage;
