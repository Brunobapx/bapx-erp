import React from 'react';
import { Tabs } from "@/components/ui/tabs";
import { Settings as SettingsIcon } from 'lucide-react';
import { SettingsPageTabs } from './SettingsPage/SettingsPageTabs';
import { SettingsPageContent } from './SettingsPage/SettingsPageContent';
import { useAuth } from '@/components/Auth/AuthProvider';

const SettingsPage = () => {
  const { 
    loading,
    isAdmin,
    isMaster
  } = useAuth();

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

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <SettingsIcon className="h-8 w-8 text-primary" />
        <h1 className="text-3xl font-bold">Configurações</h1>
      </div>

      <Tabs defaultValue="profile" className="space-y-6">
        <SettingsPageTabs isAdmin={userIsAdmin} />
        <SettingsPageContent isAdmin={userIsAdmin} />
      </Tabs>
    </div>
  );
};

export default SettingsPage;