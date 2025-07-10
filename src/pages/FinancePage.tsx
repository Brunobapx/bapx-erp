
import React, { useState } from 'react';
import { ApprovalModal } from '@/components/Modals/ApprovalModal';
import StageAlert from '@/components/Alerts/StageAlert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useUnifiedFinancialEntries } from '@/hooks/useUnifiedFinancialEntries';
import { CashFlowTab } from '@/components/Finance/CashFlowTab';
import { AccountsPayableTab } from '@/components/Finance/AccountsPayableTab';
import { AccountsReceivableTab } from '@/components/Finance/AccountsReceivableTab';
import { DRETab } from '@/components/Finance/DRETab';
import { ReportsTab } from '@/components/Finance/ReportsTab';
import { FinanceSettingsTab } from "@/components/Finance/FinanceSettingsTab";
import ConciliacaoBancariaTab from "@/components/Finance/ConciliacaoBancariaTab";
import { FinanceHeader } from "@/components/Finance/FinanceHeader";
import { FinanceOverviewFilters } from "@/components/Finance/FinanceOverviewFilters";
import { FinanceOverviewTable } from "@/components/Finance/FinanceOverviewTable";
import { FinanceDashboard } from "@/components/Finance/Dashboard/FinanceDashboard";
import { FinancialProvider } from "@/contexts/FinancialContext";
import { useFinancialCleanup } from '@/hooks/useFinancialCleanup';
import { Button } from "@/components/ui/button";
import { Trash2, Loader2 } from 'lucide-react';

const FinancePage = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [alerts, setAlerts] = useState([
    {
      id: 'alert-1',
      type: 'finance' as const,
      message: 'Lançamento #F-004 aguardando confirmação de pagamento',
      time: '2 dias'
    }
  ]);

  const { entries, loading, error } = useUnifiedFinancialEntries();
  const { cleanupDuplicateEntries, isCleaningUp } = useFinancialCleanup();

  if (loading) {
    return (
      <div className="p-4 sm:p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600">Carregando dados financeiros...</p>
          </div>
        </div>
      </div>
    );
  }

  // Financial metrics
  const totalReceitas = entries.filter(item => item.type === 'receivable').reduce((total, item) => total + Number(item.amount), 0);
  const totalDespesas = entries.filter(item => item.type === 'payable').reduce((total, item) => total + Number(item.amount), 0);
  const saldo = totalReceitas - totalDespesas;

  // Filtro por busca
  const filteredItems = entries.filter(item => {
    const searchString = searchQuery.toLowerCase();
    return (
      item.entry_number.toLowerCase().includes(searchString) ||
      item.description.toLowerCase().includes(searchString) ||
      item.type.toLowerCase().includes(searchString)
    );
  });

  const handleItemClick = (item: any) => {
    setSelectedItem(item);
    setShowModal(true);
  };

  const handleDismissAlert = (id: string) => {
    setAlerts(alerts.filter(alert => alert.id !== id));
  };

  const handleCleanupDuplicates = async () => {
    const cleanedCount = await cleanupDuplicateEntries();
    if (cleanedCount > 0) {
      // Recarregar dados após limpeza
      window.location.reload();
    }
  };

  return (
    <FinancialProvider>
      <div className="p-4 sm:p-6 space-y-6">
        <div className="flex justify-between items-start">
          <FinanceHeader
            saldo={saldo}
            totalReceitas={totalReceitas}
            totalDespesas={totalDespesas}
            onNewEntry={() => setShowModal(true)}
          />
          
          <Button 
            onClick={handleCleanupDuplicates}
            disabled={isCleaningUp}
            variant="outline"
            size="sm"
            className="ml-2"
          >
            {isCleaningUp ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Limpando...
              </>
            ) : (
              <>
                <Trash2 className="mr-2 h-4 w-4" />
                Limpar Duplicados
              </>
            )}
          </Button>
        </div>

        <StageAlert alerts={alerts} onDismiss={handleDismissAlert} />

        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-8">
            <TabsTrigger value="overview">Visão Geral</TabsTrigger>
            <TabsTrigger value="cash-flow">Fluxo de Caixa</TabsTrigger>
            <TabsTrigger value="accounts-payable">Contas a Pagar</TabsTrigger>
            <TabsTrigger value="accounts-receivable">Contas a Receber</TabsTrigger>
            <TabsTrigger value="dre">DRE</TabsTrigger>
            <TabsTrigger value="reports">Relatórios</TabsTrigger>
            <TabsTrigger value="settings">Configurações</TabsTrigger>
            <TabsTrigger value="conciliacao-bancaria">Conciliação Bancária</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="mt-6">
            <FinanceDashboard />
          </TabsContent>

          <TabsContent value="cash-flow">
            <CashFlowTab />
          </TabsContent>

          <TabsContent value="accounts-payable">
            <AccountsPayableTab />
          </TabsContent>

          <TabsContent value="accounts-receivable">
            <AccountsReceivableTab />
          </TabsContent>

          <TabsContent value="dre">
            <DRETab />
          </TabsContent>

          <TabsContent value="reports">
            <ReportsTab />
          </TabsContent>

          <TabsContent value="settings">
            <FinanceSettingsTab />
          </TabsContent>

          <TabsContent value="conciliacao-bancaria" className="mt-6">
            <React.Suspense fallback={<div>Carregando...</div>}>
              <ConciliacaoBancariaTab />
            </React.Suspense>
          </TabsContent>
        </Tabs>

        <ApprovalModal
          isOpen={showModal}
          onClose={() => setShowModal(false)}
          stage="finance"
          orderData={selectedItem || {
            id: 'NOVO',
            product: '',
            quantity: 1,
            customer: ''
          }}
        />
      </div>
    </FinancialProvider>
  );
};

export default FinancePage;
