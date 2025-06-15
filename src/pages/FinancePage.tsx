import React, { useState } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ApprovalModal } from '@/components/Modals/ApprovalModal';
import { DollarSign, ChevronDown, Search, ArrowDown, ArrowUp, TrendingUp } from 'lucide-react';
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import StageAlert from '@/components/Alerts/StageAlert';
import { CashFlowTab } from '@/components/Finance/CashFlowTab';
import { AccountsPayableTab } from '@/components/Finance/AccountsPayableTab';
import { AccountsReceivableTab } from '@/components/Finance/AccountsReceivableTab';
import { DRETab } from '@/components/Finance/DRETab';
import { ReportsTab } from '@/components/Finance/ReportsTab';
import { FinanceSettingsTab } from "@/components/Finance/FinanceSettingsTab";
import { useFinancialEntries } from '@/hooks/useFinancialEntries';

const FinancePage = () => {
  const [searchQuery, setSearchQuery] = useState('');
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

  const { entries, loading, error } = useFinancialEntries();

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

  // Filter items based on search query
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

  // Calculate financial metrics
  const totalReceitas = entries
    .filter(item => item.type === 'receivable')
    .reduce((total, item) => total + Number(item.amount), 0);
  
  const totalDespesas = entries
    .filter(item => item.type === 'payable')
    .reduce((total, item) => total + Number(item.amount), 0);
  
  const saldo = totalReceitas - totalDespesas;

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Financeiro</h1>
          <p className="text-muted-foreground">Gerencie todos os aspectos financeiros da empresa.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Card className="bg-sales/10">
            <CardContent className="flex items-center gap-2 p-2">
              <ArrowUp className="h-5 w-5 text-sales" />
              <div>
                <p className="text-xs text-muted-foreground">Receitas</p>
                <p className="font-bold text-sales">R$ {totalReceitas.toLocaleString('pt-BR')}</p>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-erp-alert/10">
            <CardContent className="flex items-center gap-2 p-2">
              <ArrowDown className="h-5 w-5 text-erp-alert" />
              <div>
                <p className="text-xs text-muted-foreground">Despesas</p>
                <p className="font-bold text-erp-alert">R$ {totalDespesas.toLocaleString('pt-BR')}</p>
              </div>
            </CardContent>
          </Card>
          <Card className={`${saldo >= 0 ? 'bg-sales/10' : 'bg-erp-alert/10'}`}>
            <CardContent className="flex items-center gap-2 p-2">
              <TrendingUp className={`h-5 w-5 ${saldo >= 0 ? 'text-sales' : 'text-erp-alert'}`} />
              <div>
                <p className="text-xs text-muted-foreground">Saldo</p>
                <p className={`font-bold ${saldo >= 0 ? 'text-sales' : 'text-erp-alert'}`}>
                  R$ {saldo.toLocaleString('pt-BR')}
                </p>
              </div>
            </CardContent>
          </Card>
          <Button onClick={() => setShowModal(true)}>
            <DollarSign className="mr-2 h-4 w-4" /> Novo Lançamento
          </Button>
        </div>
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
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row gap-4 sm:items-center justify-between">
              <div className="relative w-full sm:max-w-xs">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar lançamentos..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8"
                />
              </div>
              
              <div className="flex items-center gap-2">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm">
                      Tipo <ChevronDown className="ml-2 h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    <DropdownMenuItem>Todos</DropdownMenuItem>
                    <DropdownMenuItem>Receitas</DropdownMenuItem>
                    <DropdownMenuItem>Despesas</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
                
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm">
                      Status <ChevronDown className="ml-2 h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    <DropdownMenuItem>Todos</DropdownMenuItem>
                    <DropdownMenuItem>Pago</DropdownMenuItem>
                    <DropdownMenuItem>Pendente</DropdownMenuItem>
                    <DropdownMenuItem>Aguardando Confirmação</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
                
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm">
                      Ordenar <ChevronDown className="ml-2 h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    <DropdownMenuItem>Vencimento próximo</DropdownMenuItem>
                    <DropdownMenuItem>Vencimento distante</DropdownMenuItem>
                    <DropdownMenuItem>Maior valor</DropdownMenuItem>
                    <DropdownMenuItem>Menor valor</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
            
            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ID</TableHead>
                      <TableHead>Descrição</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead className="text-right">Valor (R$)</TableHead>
                      <TableHead>Vencimento</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Pagamento</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredItems.map((item) => (
                      <TableRow 
                        key={item.id}
                        className="cursor-pointer hover:bg-accent/5"
                        onClick={() => handleItemClick(item)}
                      >
                        <TableCell className="font-medium">{item.entry_number}</TableCell>
                        <TableCell>{item.description}</TableCell>
                        <TableCell>
                          <span className={`stage-badge ${item.type === 'receivable' ? 'badge-sales' : 'badge-route'}`}>
                            {item.type === 'receivable' ? 'Receita' : 'Despesa'}
                          </span>
                        </TableCell>
                        <TableCell className="text-right">{Number(item.amount).toLocaleString('pt-BR')}</TableCell>
                        <TableCell>{new Date(item.due_date).toLocaleDateString('pt-BR')}</TableCell>
                        <TableCell>
                          <span className="stage-badge badge-finance">
                            {item.payment_status === 'paid' ? 'Pago' : 
                             item.payment_status === 'pending' ? 'Pendente' : 
                             item.payment_status === 'overdue' ? 'Vencido' : 'Cancelado'}
                          </span>
                        </TableCell>
                        <TableCell>{item.payment_date ? new Date(item.payment_date).toLocaleDateString('pt-BR') : '-'}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                {filteredItems.length === 0 && (
                  <div className="p-4 text-center text-muted-foreground">
                    Nenhum item encontrado.
                  </div>
                )}
              </CardContent>
            </Card>
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
            {typeof window !== "undefined" && (
              <div>
                {/* Nova aba de Conciliação Bancária */}
                {React.createElement(require('@/components/Finance/ConciliacaoBancariaTab').default)}
              </div>
            )}
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
  );
};

export default FinancePage;
