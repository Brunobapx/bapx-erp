
import React, { useState, useEffect } from 'react';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ApprovalModal } from '@/components/Modals/ApprovalModal';
import { DollarSign, Banknote, PiggyBank, FileText, Wallet } from 'lucide-react';
import StageAlert from '@/components/Alerts/StageAlert';
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

// Import finance components
import CashFlowChart from '@/components/Finance/CashFlowChart';
import TransactionList from '@/components/Finance/TransactionList';
import BankAccountsList from '@/components/Finance/BankAccountsList';
import BankReconciliation from '@/components/Finance/BankReconciliation';
import FinancialStatements from '@/components/Finance/FinancialStatements';

const FinancePage = () => {
  const [showModal, setShowModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [alerts, setAlerts] = useState([]);
  const [orders, setOrders] = useState([]);
  const { toast } = useToast();

  useEffect(() => {
    fetchFinanceAlerts();
    fetchPendingOrders();
  }, []);

  const fetchFinanceAlerts = async () => {
    try {
      // Get orders with "Financeiro Pendente" status
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq('status', 'Financeiro Pendente')
        .order('created_at', { ascending: true });
      
      if (error) throw error;
      
      // Create alerts from orders
      const newAlerts = data.map((order, index) => ({
        id: `alert-finance-${index}`,
        type: 'finance' as const,
        message: `Lançamento #F-${order.id.substring(0, 5)} aguardando confirmação de pagamento`,
        time: getTimeAgo(new Date(order.created_at))
      }));
      
      setAlerts(newAlerts);
      
    } catch (error) {
      console.error('Error fetching finance alerts:', error);
    }
  };

  const fetchPendingOrders = async () => {
    try {
      // Get orders with "Financeiro Pendente" status
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq('status', 'Financeiro Pendente');
      
      if (error) throw error;
      
      setOrders(data || []);
      
    } catch (error) {
      console.error('Error fetching pending orders:', error);
    }
  };

  const getTimeAgo = (date) => {
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 24) return `${diffInHours} horas`;
    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays} ${diffInDays === 1 ? 'dia' : 'dias'}`;
  };

  const handleItemClick = (item) => {
    setSelectedItem(item);
    setShowModal(true);
  };

  const handleNewTransaction = () => {
    setSelectedItem(null);
    setShowModal(true);
  };

  const handleDismissAlert = (id) => {
    setAlerts(alerts.filter(alert => alert.id !== id));
  };

  const handleFinanceApproval = async (formData) => {
    try {
      // Update order status
      const { error: orderError } = await supabase
        .from('orders')
        .update({ status: 'Aguardando Rota' })
        .eq('id', formData.id);
      
      if (orderError) throw orderError;

      // Update financial transaction
      const { error: txError } = await supabase
        .from('finance_transactions')
        .update({ payment_status: 'completed' })
        .eq('reference_id', formData.id);
      
      if (txError) console.error('Error updating transaction:', txError);
      
      toast({
        title: "Pagamento confirmado",
        description: `Pedido liberado para roteirização.`,
      });

      // Refresh data
      fetchFinanceAlerts();
      fetchPendingOrders();
      
    } catch (error) {
      console.error('Error approving finance:', error);
      toast({
        title: "Erro ao confirmar pagamento",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Financeiro</h1>
          <p className="text-muted-foreground">Gerencie todos os aspectos financeiros da empresa.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button onClick={handleNewTransaction}>
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
          <TransactionList 
            onItemClick={handleItemClick} 
            pendingOrders={orders}
          />
        </TabsContent>
        
        <TabsContent value="transactions" className="mt-0">
          <TransactionList 
            onItemClick={handleItemClick} 
            pendingOrders={orders}
          />
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
        onSave={handleFinanceApproval}
      />
    </div>
  );
};

export default FinancePage;
