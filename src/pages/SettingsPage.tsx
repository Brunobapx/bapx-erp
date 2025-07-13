import React, { useState, useEffect } from 'react';
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
    user,
    loading,
    userRole,
    isAdmin,
    isMaster
  } = useAuth();
  const { getFirstAllowedTab, allowedTabs } = useTabAccess('/configuracoes');
  const [activeTab, setActiveTab] = useState('company');

  // Determinar se o usuário é admin/master de forma consistente
  const userIsAdmin = userRole === 'admin' || userRole === 'master' || isAdmin || isMaster;

  console.log('SettingsPage rendered:', { 
    userRole,
    isAdmin, 
    isMaster,
    userIsAdmin,
    loading,
    allowedTabs: allowedTabs.length,
    activeTab
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

  useEffect(() => {
    console.log('SettingsPage useEffect:', { userIsAdmin, userRole, allowedTabs: allowedTabs.length });
    
    // Para admins/masters, não usar sistema de controle de abas
    if (userIsAdmin) {
      console.log('User is admin/master, keeping current tab:', activeTab);
      return;
    }

    // Para usuários normais, usar primeira aba permitida
    const firstTab = getFirstAllowedTab();
    console.log('Normal user, first allowed tab:', firstTab);
    
    if (firstTab && firstTab !== activeTab) {
      setActiveTab(firstTab);
    } else if (!firstTab) {
      setActiveTab('company'); // fallback
    }
  }, [userIsAdmin, userRole, allowedTabs, getFirstAllowedTab]);

  return (
    <ModuleAccessCheck routePath="/configuracoes">
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
    </ModuleAccessCheck>
  );
};

export default SettingsPage;
