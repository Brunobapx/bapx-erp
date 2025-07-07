
import { useState, useCallback, useMemo } from 'react';
import { useAuth } from '@/components/Auth/AuthProvider';

export const useSettingsState = () => {
  const { userRole, loading: authLoading, isAdmin, isMaster } = useAuth();
  const [activeTab, setActiveTab] = useState('profile');
  const [loading, setLoading] = useState(false);

  // Sistema real de usuários
  const userIsAdmin = isAdmin || isMaster;

  // Loading do auth
  const isLoading = authLoading;

  const handleTabChange = useCallback((tab: string) => {
    setActiveTab(tab);
  }, []);

  const setLoadingState = useCallback((state: boolean) => {
    setLoading(state);
  }, []);

  return {
    activeTab,
    setActiveTab: handleTabChange,
    isAdmin: userIsAdmin,
    isLoading,
    loading,
    setLoading: setLoadingState,
    userRole,
  };
};
