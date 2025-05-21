import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ApprovalModal } from '@/components/Modals/ApprovalModal';
import { DollarSign, ChevronDown, Search, ArrowDown, ArrowUp, TrendingUp } from 'lucide-react';
import { Input } from "@/components/ui/input";
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

  // Mock finance data
  const financeItems = [
    { 
      id: 'F-001', 
      saleId: 'V-001',
      customer: 'Tech Solutions',
      description: 'Venda de Server Hardware', 
      type: 'receita', 
      value: 50000,
      dueDate: '25/05/2025',
      status: 'Pago',
      paymentDate: '19/05/2025'
    },
    { 
      id: 'F-002', 
      saleId: 'V-003',
      customer: 'City Hospital',
      description: 'Venda de Medical Equipment', 
      type: 'receita', 
      value: 35000,
      dueDate: '27/05/2025',
      status: 'Pendente',
      paymentDate: '-'
    },
    { 
      id: 'F-003', 
      saleId: 'V-004',
      customer: 'Global Foods',
      description: 'Venda de Packaging Materials', 
      type: 'receita', 
      value: 9800,
      dueDate: '30/05/2025',
      status: 'Pendente',
      paymentDate: '-'
    },
    { 
      id: 'F-004', 
      saleId: 'V-002',
      customer: 'Green Energy Inc',
      description: 'Venda de Solar Panels', 
      type: 'receita', 
      value: 75000,
      dueDate: '15/06/2025',
      status: 'Aguardando Confirmação',
      paymentDate: '-'
    },
    { 
      id: 'F-005', 
      saleId: '-',
      customer: 'Fornecedor A',
      description: 'Compra de Matéria Prima', 
      type: 'despesa', 
      value: 15000,
      dueDate: '20/05/2025',
      status: 'Pago',
      paymentDate: '18/05/2025'
    }
  ];

  // Filter items based on search query
  const filteredItems = financeItems.filter(item => {
    const searchString = searchQuery.toLowerCase();
    return (
      item.id.toLowerCase().includes(searchString) ||
      item.saleId.toLowerCase().includes(searchString) ||
      item.customer.toLowerCase().includes(searchString) ||
      item.description.toLowerCase().includes(searchString) ||
      item.status.toLowerCase().includes(searchString)
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
  const totalReceitas = financeItems
    .filter(item => item.type === 'receita')
    .reduce((total, item) => total + item.value, 0);
  
  const totalDespesas = financeItems
    .filter(item => item.type === 'despesa')
    .reduce((total, item) => total + item.value, 0);
  
  const saldo = totalReceitas - totalDespesas;

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Financeiro</h1>
          <p className="text-muted-foreground">Gerencie todos os lançamentos financeiros.</p>
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
                <TableHead>ID Venda</TableHead>
                <TableHead>Cliente/Fornecedor</TableHead>
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
                  <TableCell className="font-medium">{item.id}</TableCell>
                  <TableCell>{item.saleId}</TableCell>
                  <TableCell>{item.customer}</TableCell>
                  <TableCell>{item.description}</TableCell>
                  <TableCell>
                    <span className={`stage-badge ${item.type === 'receita' ? 'badge-sales' : 'badge-route'}`}>
                      {item.type === 'receita' ? 'Receita' : 'Despesa'}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">{item.value.toLocaleString('pt-BR')}</TableCell>
                  <TableCell>{item.dueDate}</TableCell>
                  <TableCell>
                    <span className="stage-badge badge-finance">
                      {item.status}
                    </span>
                  </TableCell>
                  <TableCell>{item.paymentDate}</TableCell>
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
