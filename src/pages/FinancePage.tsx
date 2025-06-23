
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
import { FinancialProvider } from "@/contexts/FinancialContext";

const FinancePage = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortOrder, setSortOrder] = useState('recent');
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

  // Apply filters
  const filteredItems = React.useMemo(() => {
    let filtered = [...entries];
    
    // Apply type filter
    if (typeFilter !== 'all') {
      filtered = filtered.filter(item => item.type === typeFilter);
    }
    
    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(item => item.payment_status === statusFilter);
    }
    
    // Apply search filter
    if (searchQuery) {
      const search = searchQuery.toLowerCase();
      filtered = filtered.filter(item =>
        item.entry_number.toLowerCase().includes(search) ||
        item.description.toLowerCase().includes(search) ||
        item.type.toLowerCase().includes(search)
      );
    }
    
    // Apply sorting
    filtered.sort((a, b) => {
      switch (sortOrder) {
        case 'recent':
          return new Date(b.created_at || '').getTime() - new Date(a.created_at || '').getTime();
        case 'oldest':
          return new Date(a.created_at || '').getTime() - new Date(b.created_at || '').getTime();
        case 'due_near':
          return new Date(a.due_date || '').getTime() - new Date(b.due_date || '').getTime();
        case 'due_far':
          return new Date(b.due_date || '').getTime() - new Date(a.due_date || '').getTime();
        case 'amount_high':
          return Number(b.amount) - Number(a.amount);
        case 'amount_low':
          return Number(a.amount) - Number(b.amount);
        default:
          return 0;
      }
    });
    
    return filtered;
  }, [entries, typeFilter, statusFilter, searchQuery, sortOrder]);

  const handleItemClick = (item: any) => {
    setSelectedItem(item);
    setShowModal(true);
  };

  const handleDismissAlert = (id: string) => {
    setAlerts(alerts.filter(alert => alert.id !== id));
  };

  return (
    <FinancialProvider>
      <div className="p-4 sm:p-6 space-y-6">
        <FinanceHeader
          saldo={saldo}
          totalReceitas={totalReceitas}
          totalDespesas={totalDespesas}
          onNewEntry={() => setShowModal(true)}
        />

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
            <div className="space-y-6">
              <FinanceOverviewFilters
                searchQuery={searchQuery}
                setSearchQuery={setSearchQuery}
                typeFilter={typeFilter}
                setTypeFilter={setTypeFilter}
                statusFilter={statusFilter}
                setStatusFilter={setStatusFilter}
                sortOrder={sortOrder}
                setSortOrder={setSortOrder}
              />
              <div className="p-0">
                <FinanceOverviewTable items={filteredItems} onItemClick={handleItemClick} />
                {filteredItems.length === 0 && (
                  <div className="p-4 text-center text-muted-foreground">
                    Nenhum item encontrado.
                  </div>
                )}
              </div>
            </div>
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
