import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ApprovalModal } from '@/components/Modals/ApprovalModal';
import { DollarSign, ChevronDown, Search, TrendingUp } from 'lucide-react';
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

const SalesPage = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [alerts, setAlerts] = useState([
    {
      id: 'alert-1',
      type: 'sales' as const,
      message: 'Venda #V-002 aguardando confirmação para faturamento',
      time: '3 horas'
    }
  ]);

  // Mock sales data
  const salesItems = [
    { 
      id: 'V-001', 
      orderId: 'PED-001',
      customer: 'Tech Solutions',
      product: 'Server Hardware', 
      quantity: 10, 
      value: 50000,
      date: '19/05/2025',
      status: 'Confirmada',
      payment: 'À Vista'
    },
    { 
      id: 'V-002', 
      orderId: 'PED-002',
      customer: 'Green Energy Inc',
      product: 'Solar Panels', 
      quantity: 50, 
      value: 75000,
      date: '18/05/2025',
      status: 'Aguardando Confirmação',
      payment: 'Parcelado'
    },
    { 
      id: 'V-003', 
      orderId: 'PED-003',
      customer: 'City Hospital',
      product: 'Medical Equipment', 
      quantity: 5, 
      value: 35000,
      date: '17/05/2025',
      status: 'Confirmada',
      payment: 'À Vista'
    },
    { 
      id: 'V-004', 
      orderId: 'PED-004',
      customer: 'Global Foods',
      product: 'Packaging Materials', 
      quantity: 98, 
      value: 9800,
      date: '16/05/2025',
      status: 'Faturada',
      payment: 'Parcelado'
    }
  ];

  // Filter items based on search query
  const filteredItems = salesItems.filter(item => {
    const searchString = searchQuery.toLowerCase();
    return (
      item.id.toLowerCase().includes(searchString) ||
      item.orderId.toLowerCase().includes(searchString) ||
      item.customer.toLowerCase().includes(searchString) ||
      item.product.toLowerCase().includes(searchString) ||
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

  // Calculate total sales
  const totalSales = salesItems.reduce((total, item) => {
    if (item.status === 'Confirmada' || item.status === 'Faturada') {
      return total + item.value;
    }
    return total;
  }, 0);

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Vendas</h1>
          <p className="text-muted-foreground">Gerencie todas as vendas do sistema.</p>
        </div>
        <div className="flex items-center gap-2">
          <Card className="bg-sales/10">
            <CardContent className="flex items-center gap-2 p-2">
              <TrendingUp className="h-5 w-5 text-sales" />
              <div>
                <p className="text-xs text-muted-foreground">Total de Vendas</p>
                <p className="font-bold text-sales">R$ {totalSales.toLocaleString('pt-BR')}</p>
              </div>
            </CardContent>
          </Card>
          <Button onClick={() => setShowModal(true)}>
            <DollarSign className="mr-2 h-4 w-4" /> Nova Venda
          </Button>
        </div>
      </div>
      
      <StageAlert alerts={alerts} onDismiss={handleDismissAlert} />
      
      <div className="flex flex-col sm:flex-row gap-4 sm:items-center justify-between">
        <div className="relative w-full sm:max-w-xs">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar vendas..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8"
          />
        </div>
        
        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                Status <ChevronDown className="ml-2 h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem>Todos</DropdownMenuItem>
              <DropdownMenuItem>Confirmada</DropdownMenuItem>
              <DropdownMenuItem>Aguardando Confirmação</DropdownMenuItem>
              <DropdownMenuItem>Faturada</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                Ordenar <ChevronDown className="ml-2 h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem>Mais recentes</DropdownMenuItem>
              <DropdownMenuItem>Mais antigos</DropdownMenuItem>
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
                <TableHead>Pedido</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead>Produto</TableHead>
                <TableHead className="text-center">Qtd</TableHead>
                <TableHead className="text-right">Valor (R$)</TableHead>
                <TableHead>Data</TableHead>
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
                  <TableCell>{item.orderId}</TableCell>
                  <TableCell>{item.customer}</TableCell>
                  <TableCell>{item.product}</TableCell>
                  <TableCell className="text-center">{item.quantity}</TableCell>
                  <TableCell className="text-right">{item.value.toLocaleString('pt-BR')}</TableCell>
                  <TableCell>{item.date}</TableCell>
                  <TableCell>
                    <span className="stage-badge badge-sales">
                      {item.status}
                    </span>
                  </TableCell>
                  <TableCell>{item.payment}</TableCell>
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
        stage="sales"
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

export default SalesPage;
