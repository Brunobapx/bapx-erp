
import React, { createContext, useContext, ReactNode } from 'react';
import { useCompany, Company } from '@/hooks/useCompany';

interface CompanyContextType {
  company: Company | null;
  loading: boolean;
  detectCompanyFromSubdomain: () => string;
  loadCompany: () => Promise<void>;
}

const CompanyContext = createContext<CompanyContextType | undefined>(undefined);

export const useCompanyContext = () => {
  const context = useContext(CompanyContext);
  if (context === undefined) {
    throw new Error('useCompanyContext must be used within a CompanyProvider');
  }
  return context;
};

export const CompanyProvider = ({ children }: { children: ReactNode }) => {
  const companyData = useCompany();

  return (
    <CompanyContext.Provider value={companyData}>
      {children}
    </CompanyContext.Provider>
  );
};
