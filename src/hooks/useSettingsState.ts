
import { useState, useCallback, useMemo } from 'react';
import { useAuth } from '@/components/Auth/AuthProvider';

export const useSettingsState = () => {
  const { userRole } = useAuth();
  const [activeTab, setActiveTab] = useState('company');
  const [loading, setLoading] = useState(false);

  // Sem sistema de usuários, sempre admin
  const isAdmin = true;

  // Sem sistema de usuários, sempre permitir acesso
  const isLoading = false;

  const handleTabChange = useCallback((tab: string) => {
    setActiveTab(tab);
  }, []);

  const setLoadingState = useCallback((state: boolean) => {
    setLoading(state);
  }, []);

  return {
    activeTab,
    setActiveTab: handleTabChange,
    isAdmin,
    isLoading,
    loading,
    setLoading: setLoadingState,
    userRole,
  };
};
