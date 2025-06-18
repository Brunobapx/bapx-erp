
import React, { createContext, useContext, useState, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';

interface FinancialContextType {
  refreshAllFinancialData: () => void;
  refreshCashFlow: () => void;
  refreshAccountsReceivable: () => void;
  refreshAccountsPayable: () => void;
  refreshReconciliation: () => void;
  lastUpdated: Date | null;
}

const FinancialContext = createContext<FinancialContextType | undefined>(undefined);

export const FinancialProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const queryClient = useQueryClient();

  const refreshAllFinancialData = useCallback(() => {
    console.log('Refreshing all financial data...');
    setLastUpdated(new Date());
    
    // Invalidate all financial-related queries
    queryClient.invalidateQueries({ queryKey: ['cashFlow'] });
    queryClient.invalidateQueries({ queryKey: ['financial_entries'] });
    queryClient.invalidateQueries({ queryKey: ['accounts_receivable'] });
    queryClient.invalidateQueries({ queryKey: ['accounts_payable'] });
    queryClient.invalidateQueries({ queryKey: ['extrato_conciliado'] });
    queryClient.invalidateQueries({ queryKey: ['financial_entries_reconciliation'] });
  }, [queryClient]);

  const refreshCashFlow = useCallback(() => {
    console.log('Refreshing cash flow...');
    setLastUpdated(new Date());
    queryClient.invalidateQueries({ queryKey: ['cashFlow'] });
  }, [queryClient]);

  const refreshAccountsReceivable = useCallback(() => {
    console.log('Refreshing accounts receivable...');
    setLastUpdated(new Date());
    queryClient.invalidateQueries({ queryKey: ['accounts_receivable'] });
    queryClient.invalidateQueries({ queryKey: ['financial_entries'] });
    queryClient.invalidateQueries({ queryKey: ['cashFlow'] });
  }, [queryClient]);

  const refreshAccountsPayable = useCallback(() => {
    console.log('Refreshing accounts payable...');
    setLastUpdated(new Date());
    queryClient.invalidateQueries({ queryKey: ['accounts_payable'] });
    queryClient.invalidateQueries({ queryKey: ['financial_entries'] });
    queryClient.invalidateQueries({ queryKey: ['cashFlow'] });
  }, [queryClient]);

  const refreshReconciliation = useCallback(() => {
    console.log('Refreshing reconciliation data...');
    setLastUpdated(new Date());
    queryClient.invalidateQueries({ queryKey: ['extrato_conciliado'] });
    queryClient.invalidateQueries({ queryKey: ['financial_entries_reconciliation'] });
    queryClient.invalidateQueries({ queryKey: ['financial_entries'] });
    queryClient.invalidateQueries({ queryKey: ['cashFlow'] });
  }, [queryClient]);

  return (
    <FinancialContext.Provider value={{
      refreshAllFinancialData,
      refreshCashFlow,
      refreshAccountsReceivable,
      refreshAccountsPayable,
      refreshReconciliation,
      lastUpdated
    }}>
      {children}
    </FinancialContext.Provider>
  );
};

export const useFinancialContext = () => {
  const context = useContext(FinancialContext);
  if (context === undefined) {
    throw new Error('useFinancialContext must be used within a FinancialProvider');
  }
  return context;
};
