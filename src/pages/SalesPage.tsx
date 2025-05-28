
import React, { useState } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ApprovalModal } from '@/components/Modals/ApprovalModal';
import { InvoiceModal } from '@/components/Modals/InvoiceModal';
import { DollarSign, ChevronDown, Search, TrendingUp, FileText } from 'lucide-react';
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
import { toast } from "sonner";
import { useSales } from '@/hooks/useSales';

const SalesPage = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [alerts, setAlerts] = useState([
    {
      id: 'alert-1',
      type: 'sales' as const,
      message: 'Venda aguardando confirmação para faturamento',
      time: '3 horas'
    }
  ]);

  const { sales, loading, error, updateSaleStatus } = useSales();

  // Filter items based on search query
  const filteredItems = sales.filter(item => {
    const searchString = searchQuery.toLowerCase();
    return (
      item.sale_number?.toLowerCase().includes(searchString) ||
      item.order_number?.toLowerCase().includes(searchString) ||
      item.client_name?.toLowerCase().includes(searchString) ||
      item.status?.toLowerCase().includes(searchString)
    );
  });

  const handleItemClick = (item) => {
    setSelectedItem(item);
    setShowModal(true);
  };

  const handleInvoiceClick = (item) => {
    setSelectedItem(item);
    setShowInvoiceModal(true);
  };

  const handleDismissAlert = (id) => {
    setAlerts(alerts.filter(alert => alert.id !== id));
  };

  // Calculate total sales
  const totalSales = sales.reduce((total, item) => {
    if (item.status === 'confirmed' || item.status === 'invoiced' || item.status === 'delivered') {
      return total + item.total_amount;
    }
    return total;
  }, 0);

  const handleApproveSale = async (data) => {
    await updateSaleStatus(data.id, 'confirmed');
    return Promise.resolve();
  };

  const handleNextStage = async (data) => {
    await updateSaleStatus(data.id, 'invoiced');
    return Promise.resolve();
  };

  const handleEmitInvoice = async (data) => {
    await updateSaleStatus(data.id, 'invoiced', data.invoice_number);
    return Promise.resolve();
  };

  const handleCreateSale = () => {
    toast.info("Para criar uma venda, primeiro complete o processo de embalagem");
  };

  const handleModalClose = (refresh = false) => {
    setShowModal(false);
    
    if (refresh) {
      toast.success("Lista de vendas atualizada");
    }
  };

  const handleInvoiceModalClose = (refresh = false) => {
    setShowInvoiceModal(false);
    
    if (refresh) {
      toast.success("Nota fiscal emitida com sucesso");
    }
  };

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'pending':
        return 'badge-production';
      case 'confirmed':
        return 'badge-sales';
      case 'invoiced':
        return 'badge-packaging';
      case 'delivered':
        return 'badge-route';
      default:
        return 'badge-production';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'pending':
        return 'Pendente';
      case 'confirmed':
        return 'Confirmada';
      case 'invoiced':
        return 'Faturada';
      case 'delivered':
        return 'Entregue';
      default:
        return status;
    }
  };

  if (loading) {
    return (
      <div className="p-4 sm:p-6 space-y-6">
        <div className="text-center">Carregando vendas...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 sm:p-6 space-y-6">
        <div className="text-center text-red-500">Erro: {error}</div>
      </div>
    );
  }

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
          <Button onClick={handleCreateSale}>
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
              <DropdownMenuItem onClick={() => setSearchQuery('')}>Todos</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setSearchQuery('Confirmada')}>Confirmada</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setSearchQuery('Pendente')}>
                Pendente
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setSearchQuery('Faturada')}>Faturada</DropdownMenuItem>
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
                <TableHead>Venda</TableHead>
                <TableHead>Pedido</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead className="text-right">Valor (R$)</TableHead>
                <TableHead>Data</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredItems.map((item) => (
                <TableRow 
                  key={item.id}
                  className="cursor-pointer hover:bg-accent/5"
                  onClick={() => handleItemClick(item)}
                >
                  <TableCell className="font-medium">{item.sale_number}</TableCell>
                  <TableCell>{item.order_number}</TableCell>
                  <TableCell>{item.client_name}</TableCell>
                  <TableCell className="text-right">{item.total_amount.toLocaleString('pt-BR')}</TableCell>
                  <TableCell>{new Date(item.created_at || '').toLocaleDateString('pt-BR')}</TableCell>
                  <TableCell>
                    <span className={`stage-badge ${getStatusBadgeClass(item.status)}`}>
                      {getStatusLabel(item.status)}
                    </span>
                  </TableCell>
                  <TableCell>
                    {item.status === 'confirmed' && (
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleInvoiceClick(item);
                        }}
                      >
                        <FileText className="mr-1 h-3 w-3" />
                        Emitir NF
                      </Button>
                    )}
                  </TableCell>
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
        onClose={handleModalClose}
        stage="sales"
        orderData={selectedItem || {
          id: 'NOVO', 
          product: '', 
          quantity: 1, 
          customer: ''
        }}
        onApprove={handleApproveSale}
        onNextStage={handleNextStage}
      />
      
      <InvoiceModal
        isOpen={showInvoiceModal}
        onClose={handleInvoiceModalClose}
        saleData={selectedItem}
        onEmitInvoice={handleEmitInvoice}
      />
    </div>
  );
};

export default SalesPage;
