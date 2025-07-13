import React, { useState } from 'react';
import { Tabs } from "@/components/ui/tabs";
import { Settings as SettingsIcon } from 'lucide-react';
import { SettingsPageTabs } from './SettingsPage/SettingsPageTabs';
import { SettingsPageContent } from './SettingsPage/SettingsPageContent';
import { useAuth } from '@/components/Auth/AuthProvider';
import { ModuleAccessCheck } from '@/components/Auth/ModuleAccessCheck';
import { TabAccessCheck } from '@/components/Auth/TabAccessCheck';
import { useTabAccess } from '@/hooks/useTabAccess';

const SettingsPage = () => {
  const { 
    loading,
    isAdmin,
    isMaster
  } = useAuth();
  const { getFirstAllowedTab } = useTabAccess('/configuracoes');
  const [activeTab, setActiveTab] = useState('');

  console.log('SettingsPage rendered:', { 
    isAdmin, 
    isMaster,
    loading
  });

  // Show loading if still getting auth info
  if (loading) {
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

  const userIsAdmin = isAdmin || isMaster;

  React.useEffect(() => {
    const firstTab = getFirstAllowedTab();
    if (firstTab) {
      setActiveTab(firstTab);
    }
  }, [getFirstAllowedTab]);

  return (
    <ModuleAccessCheck routePath="/configuracoes">
      <TabAccessCheck moduleRoute="/configuracoes">
        <div className="container mx-auto p-6 space-y-6">
          <div className="flex items-center gap-3 mb-6">
            <SettingsIcon className="h-8 w-8 text-primary" />
            <h1 className="text-3xl font-bold">Configurações</h1>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <SettingsPageTabs isAdmin={userIsAdmin} moduleRoute="/configuracoes" />
            <SettingsPageContent isAdmin={userIsAdmin} />
          </Tabs>
        </div>
      </TabAccessCheck>
    </ModuleAccessCheck>
  );
};

export default SettingsPage;