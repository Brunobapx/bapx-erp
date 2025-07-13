import React from 'react';
import { useTabAccess } from '@/hooks/useTabAccess';
import { TabsList, TabsTrigger } from '@/components/ui/tabs';

interface TabAccessCheckProps {
  moduleRoute: string;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export const TabAccessCheck: React.FC<TabAccessCheckProps> = ({ 
  moduleRoute, 
  children, 
  fallback 
}) => {
  const { allowedTabs, loading } = useTabAccess(moduleRoute);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-4">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (allowedTabs.length === 0) {
    return (
      <div className="text-center p-8">
        <p className="text-muted-foreground">
          Você não tem permissão para acessar nenhuma aba desta seção.
        </p>
        {fallback}
      </div>
    );
  }

  return <>{children}</>;
};

interface AccessibleTabsListProps {
  moduleRoute: string;
  children: React.ReactNode;
  className?: string;
}

export const AccessibleTabsList: React.FC<AccessibleTabsListProps> = ({ 
  moduleRoute, 
  children, 
  className 
}) => {
  const { allowedTabs, loading } = useTabAccess(moduleRoute);
  
  const filterAllowedTabs = (children: React.ReactNode): React.ReactNode => {
    if (loading) return null;
    
    return React.Children.map(children, (child) => {
      if (React.isValidElement(child) && child.type === TabsTrigger) {
        const tabValue = child.props.value;
        const isAllowed = allowedTabs.some(tab => tab.tab_key === tabValue);
        return isAllowed ? child : null;
      }
      return child;
    });
  };

  if (loading) {
    return (
      <TabsList className={className}>
        <div className="flex items-center justify-center p-4">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary mr-2"></div>
          Carregando abas...
        </div>
      </TabsList>
    );
  }

  return (
    <TabsList className={className}>
      {filterAllowedTabs(children)}
    </TabsList>
  );
};