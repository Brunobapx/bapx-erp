
import { useState, useCallback, useMemo } from 'react';
import { useAuth } from '@/components/Auth/AuthProvider';

export const useSettingsState = () => {
  const { userRole, companyInfo } = useAuth();
  const [activeTab, setActiveTab] = useState('profile');
  const [loading, setLoading] = useState(false);

  const isAdmin = useMemo(() => 
    userRole === 'admin' || userRole === 'master', 
    [userRole]
  );

  const isLoading = useMemo(() => 
    !userRole || !companyInfo, 
    [userRole, companyInfo]
  );

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
    companyInfo,
  };
};
