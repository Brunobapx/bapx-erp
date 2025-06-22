
import React, { useState } from 'react';
import { Tabs } from "@/components/ui/tabs";
import { useAuth } from '@/components/Auth/AuthProvider';
import { Settings as SettingsIcon } from 'lucide-react';
import { SettingsPageTabs } from './SettingsPage/SettingsPageTabs';
import { SettingsPageContent } from './SettingsPage/SettingsPageContent';

const SettingsPage = () => {
  const { userRole, companyInfo } = useAuth();
  const [activeTab, setActiveTab] = useState('profile');

  const isAdmin = userRole === 'admin' || userRole === 'master';

  console.log('SettingsPage rendered:', { 
    userRole, 
    isAdmin, 
    companyId: companyInfo?.id,
    activeTab 
  });

  // Show loading if still getting auth info
  if (!userRole || !companyInfo) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex items-center gap-3 mb-6">
          <SettingsIcon className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold">Configurações</h1>
        </div>
        <div className="text-center p-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
          <p>Carregando configurações...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <SettingsIcon className="h-8 w-8 text-primary" />
        <h1 className="text-3xl font-bold">Configurações</h1>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <SettingsPageTabs isAdmin={isAdmin} />
        <SettingsPageContent isAdmin={isAdmin} />
      </Tabs>
    </div>
  );
};

export default SettingsPage;
