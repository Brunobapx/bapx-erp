
import React, { useState } from 'react';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ApprovalModal } from '@/components/Modals/ApprovalModal';
import { DollarSign, Banknote, PiggyBank, FileText, Wallet } from 'lucide-react';
import StageAlert from '@/components/Alerts/StageAlert';

// Import new finance components
import CashFlowChart from '@/components/Finance/CashFlowChart';
import TransactionList from '@/components/Finance/TransactionList';
import BankAccountsList from '@/components/Finance/BankAccountsList';
import BankReconciliation from '@/components/Finance/BankReconciliation';
import FinancialStatements from '@/components/Finance/FinancialStatements';

const FinancePage = () => {
  const [showModal, setShowModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [alerts, setAlerts] = useState([
    {
      id: 'alert-1',
      type: 'finance' as const,
      message: 'Lançamento #F-004 aguardando confirmação de pagamento',
      time: '2 dias'
    }
  ]);

  const handleItemClick = (item: any) => {
    setSelectedItem(item);
    setShowModal(true);
  };

  const handleDismissAlert = (id: string) => {
    setAlerts(alerts.filter(alert => alert.id !== id));
  };

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Financeiro</h1>
          <p className="text-muted-foreground">Gerencie todos os aspectos financeiros da empresa.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button onClick={() => setShowModal(true)}>
            <DollarSign className="mr-2 h-4 w-4" /> Novo Lançamento
          </Button>
        </div>
      </div>
      
      <StageAlert alerts={alerts} onDismiss={handleDismissAlert} />

      <Tabs defaultValue="dashboard" className="w-full">
        <TabsList className="mb-4 w-full flex justify-start flex-wrap">
          <TabsTrigger value="dashboard" className="flex items-center">
            <PiggyBank className="mr-2 h-4 w-4" />
            Dashboard
          </TabsTrigger>
          <TabsTrigger value="transactions" className="flex items-center">
            <Wallet className="mr-2 h-4 w-4" />
            Transações
          </TabsTrigger>
          <TabsTrigger value="accounts" className="flex items-center">
            <Banknote className="mr-2 h-4 w-4" />
            Contas
          </TabsTrigger>
          <TabsTrigger value="reconciliation" className="flex items-center">
            <FileText className="mr-2 h-4 w-4" />
            Conciliação
          </TabsTrigger>
          <TabsTrigger value="reports" className="flex items-center">
            <DollarSign className="mr-2 h-4 w-4" />
            Relatórios
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="dashboard" className="mt-0 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <CashFlowChart />
            <BankAccountsList />
          </div>
          <TransactionList />
        </TabsContent>
        
        <TabsContent value="transactions" className="mt-0">
          <TransactionList />
        </TabsContent>
        
        <TabsContent value="accounts" className="mt-0">
          <BankAccountsList />
        </TabsContent>
        
        <TabsContent value="reconciliation" className="mt-0">
          <BankReconciliation />
        </TabsContent>
        
        <TabsContent value="reports" className="mt-0">
          <FinancialStatements />
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
  );
};

export default FinancePage;
