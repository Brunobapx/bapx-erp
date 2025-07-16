
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { EditSaleModal } from '@/components/Modals/EditSaleModal';
import { FiscalEmissionModal } from '@/components/Modals/FiscalEmissionModal';
import { DeliverySlipModal } from '@/components/Modals/DeliverySlipModal';
import { DollarSign, ChevronDown, Search, TrendingUp, FileText, Truck, Eye, Edit, Check } from 'lucide-react';
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
import { useRotasOtimizadas } from '@/hooks/useRotasOtimizadas';

const SalesPage = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [showEditModal, setShowEditModal] = useState(false);
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [showDeliverySlipModal, setShowDeliverySlipModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [alerts, setAlerts] = useState([
    {
      id: 'alert-1',
      type: 'sales' as const,
      message: 'Venda aguardando confirmação para faturamento',
      time: '3 horas'
    }
  ]);

  const { sales, loading, error, updateSaleStatus, approveSale } = useSales();
  const { adicionarPedidoParaRoterizacao } = useRotasOtimizadas();

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

  const handleEditClick = (item) => {
    setSelectedItem(item);
    setShowEditModal(true);
  };

  const handleApproveClick = async (item) => {
    await approveSale(item.id);
  };

  const handleInvoiceClick = (item) => {
    setSelectedItem(item);
    setShowInvoiceModal(true);
  };

  const handleViewDeliverySlip = (item) => {
    setSelectedItem(item);
    setShowDeliverySlipModal(true);
  };

  const handleDeliveryClick = (item) => {
    // Adicionar o pedido à lista de roteirização
    adicionarPedidoParaRoterizacao({
      order_id: item.order_id,
      sale_id: item.id,
      sale_number: item.sale_number,
      client_name: item.client_name,
      total_amount: item.total_amount
    });

    // Navegar para a página de roteirização na aba de otimização OpenRoute
    navigate('/rotas', { 
      state: { 
        activeTab: 'otimizacao-roteiro'
      }
    });
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

  const handleEmitInvoice = async (data) => {
    await updateSaleStatus(data.id, 'invoiced', data.invoice_number);
    return Promise.resolve();
  };

  const handleCreateSale = () => {
    toast.info("Para criar uma venda, primeiro complete o processo de embalagem");
  };

  const handleEditModalClose = (refresh = false) => {
    setShowEditModal(false);
    
    if (refresh) {
      toast.success("Venda atualizada com sucesso");
    }
  };

  const handleInvoiceModalClose = (refresh = false) => {
    setShowInvoiceModal(false);
    
    if (refresh) {
      toast.success("Nota fiscal emitida com sucesso");
    }
  };

  const handleDeliverySlipModalClose = () => {
    setShowDeliverySlipModal(false);
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
                <TableHead>Vendedor</TableHead>
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
                  className="hover:bg-accent/5"
                >
                  <TableCell className="font-medium">{item.sale_number}</TableCell>
                  <TableCell>{item.order_number}</TableCell>
                  <TableCell>{item.client_name}</TableCell>
                  <TableCell>{item.seller || 'N/A'}</TableCell>
                  <TableCell className="text-right">{item.total_amount.toLocaleString('pt-BR')}</TableCell>
                  <TableCell>{new Date(item.created_at || '').toLocaleDateString('pt-BR')}</TableCell>
                  <TableCell>
                    <span className={`stage-badge ${getStatusBadgeClass(item.status)}`}>
                      {getStatusLabel(item.status)}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {item.status === 'pending' && (
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => handleApproveClick(item)}
                          title="Aprovar Venda"
                        >
                          <Check className="mr-1 h-3 w-3" />
                          Aprovar
                        </Button>
                      )}
                      {(item.status === 'pending') && (
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => handleEditClick(item)}
                          title="Editar Venda"
                        >
                          <Edit className="mr-1 h-3 w-3" />
                          Editar
                        </Button>
                      )}
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => handleViewDeliverySlip(item)}
                        title="Visualizar Romaneio"
                      >
                        <Eye className="mr-1 h-3 w-3" />
                        Ver
                      </Button>
                      {item.status === 'confirmed' && (
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => handleInvoiceClick(item)}
                        >
                          <FileText className="mr-1 h-3 w-3" />
                          NF
                        </Button>
                      )}
                      {(item.status === 'confirmed' || item.status === 'invoiced') && (
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => handleDeliveryClick(item)}
                        >
                          <Truck className="mr-1 h-3 w-3" />
                          Entrega
                        </Button>
                      )}
                    </div>
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
      
      <EditSaleModal
        isOpen={showEditModal}
        onClose={handleEditModalClose}
        saleData={selectedItem}
      />
      
      <FiscalEmissionModal
        isOpen={showInvoiceModal}
        onClose={handleInvoiceModalClose}
        saleData={selectedItem}
      />

      <DeliverySlipModal
        isOpen={showDeliverySlipModal}
        onClose={handleDeliverySlipModalClose}
        saleData={selectedItem}
      />
    </div>
  );
};

export default SalesPage;
