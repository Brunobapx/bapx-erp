
import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ApprovalModal } from '@/components/Modals/ApprovalModal';
import { Package, ChevronDown, Search } from 'lucide-react';
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
import { toast } from "sonner";

const OrdersPage = () => {
  const [searchQuery, setSearchQuery] = React.useState('');
  const [showModal, setShowModal] = React.useState(false);
  const [selectedOrder, setSelectedOrder] = React.useState(null);
  const [statusFilter, setStatusFilter] = React.useState('active'); // 'active', 'completed', or 'all'
  const [orders, setOrders] = React.useState([
    { 
      id: 'PED-001', 
      customer: 'Tech Solutions', 
      product: 'Server Hardware', 
      quantity: 10, 
      date: '15/05/2025',
      status: 'Aguardando Produção',
      statusType: 'production',
      completed: false
    },
    { 
      id: 'PED-002', 
      customer: 'Green Energy Inc', 
      product: 'Solar Panels', 
      quantity: 50, 
      date: '14/05/2025',
      status: 'Em Produção',
      statusType: 'production',
      completed: false
    },
    { 
      id: 'PED-003', 
      customer: 'City Hospital', 
      product: 'Medical Equipment', 
      quantity: 5, 
      date: '13/05/2025',
      status: 'Aguardando Embalagem',
      statusType: 'packaging',
      completed: false
    },
    { 
      id: 'PED-004', 
      customer: 'Global Foods', 
      product: 'Packaging Materials', 
      quantity: 100, 
      date: '12/05/2025',
      status: 'Aguardando Venda',
      statusType: 'sales',
      completed: false
    },
    { 
      id: 'PED-005', 
      customer: 'Modern Office', 
      product: 'Desk Solutions', 
      quantity: 25, 
      date: '11/05/2025',
      status: 'Financeiro Pendente',
      statusType: 'finance',
      completed: false
    },
    { 
      id: 'PED-006', 
      customer: 'Local Retailer', 
      product: 'Display Units', 
      quantity: 15, 
      date: '10/05/2025',
      status: 'Aguardando Rota',
      statusType: 'route',
      completed: false
    },
    { 
      id: 'PED-007', 
      customer: 'Education Center', 
      product: 'Interactive Boards', 
      quantity: 8, 
      date: '09/05/2025',
      status: 'Aguardando Produção',
      statusType: 'production',
      completed: false
    },
  ]);

  // Filter orders based on search query and status filter
  const filteredOrders = orders.filter(order => {
    // Text search filter
    const searchString = searchQuery.toLowerCase();
    const matchesSearch = 
      order.id.toLowerCase().includes(searchString) ||
      order.customer.toLowerCase().includes(searchString) ||
      order.product.toLowerCase().includes(searchString) ||
      order.status.toLowerCase().includes(searchString);
    
    // Status filter
    if (statusFilter === 'active' && order.completed) {
      return false;
    }
    if (statusFilter === 'completed' && !order.completed) {
      return false;
    }

    return matchesSearch;
  });

  const handleOrderClick = (order) => {
    setSelectedOrder(order);
    setShowModal(true);
  };

  const handleApproveOrder = (data) => {
    // Simula a aprovação do pedido
    const updatedOrders = orders.map(order => 
      order.id === data.id 
        ? { ...order, status: 'Aprovado', statusType: 'order' }
        : order
    );
    setOrders(updatedOrders);
    return Promise.resolve();
  };

  const handleNextStage = (data) => {
    // Simula o envio para a próxima etapa
    const updatedOrders = orders.map(order => 
      order.id === data.id 
        ? { 
            ...order, 
            status: data.status, 
            statusType: data.stage,
            quantity: data.quantity || order.quantity
          }
        : order
    );
    setOrders(updatedOrders);
    return Promise.resolve();
  };

  const handleCreateOrder = () => {
    const newOrder = {
      id: `PED-${String(orders.length + 1).padStart(3, '0')}`,
      customer: '',
      product: '',
      quantity: 1,
      date: new Date().toLocaleDateString('pt-BR'),
      status: 'Novo Pedido',
      statusType: 'order',
      completed: false
    };
    
    setSelectedOrder(newOrder);
    setShowModal(true);
  };

  const handleModalClose = (refresh = false) => {
    setShowModal(false);
    
    if (refresh) {
      // Aqui poderia ter uma lógica para recarregar os dados do servidor
      toast.success("Lista de pedidos atualizada");
    }
  };

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Pedidos</h1>
          <p className="text-muted-foreground">Gerencie todos os pedidos do sistema.</p>
        </div>
        <Button onClick={handleCreateOrder}>
          <Package className="mr-2 h-4 w-4" /> Novo Pedido
        </Button>
      </div>
      
      <div className="flex flex-col sm:flex-row gap-4 sm:items-center justify-between">
        <div className="relative w-full sm:max-w-xs">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar pedidos..."
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
              <DropdownMenuItem onClick={() => setStatusFilter('all')}>
                Todos
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setStatusFilter('active')}>
                Ativos
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setStatusFilter('completed')}>
                Concluídos
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setSearchQuery('Aguardando Produção')}>
                Aguardando Produção
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setSearchQuery('Em Produção')}>
                Em Produção
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setSearchQuery('Aguardando Embalagem')}>
                Aguardando Embalagem
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setSearchQuery('Aguardando Venda')}>
                Aguardando Venda
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setSearchQuery('Financeiro Pendente')}>
                Financeiro Pendente
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setSearchQuery('Aguardando Rota')}>
                Aguardando Rota
              </DropdownMenuItem>
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
              <DropdownMenuItem>Cliente (A-Z)</DropdownMenuItem>
              <DropdownMenuItem>Cliente (Z-A)</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
      
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Pedido</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead>Produto</TableHead>
                <TableHead className="text-center">Qtd</TableHead>
                <TableHead>Data</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredOrders.map((order) => (
                <TableRow 
                  key={order.id}
                  className="cursor-pointer hover:bg-accent/5"
                  onClick={() => handleOrderClick(order)}
                >
                  <TableCell className="font-medium">{order.id}</TableCell>
                  <TableCell>{order.customer}</TableCell>
                  <TableCell>{order.product}</TableCell>
                  <TableCell className="text-center">{order.quantity}</TableCell>
                  <TableCell>{order.date}</TableCell>
                  <TableCell>
                    <span className={`stage-badge badge-${order.statusType}`}>
                      {order.status}
                    </span>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {filteredOrders.length === 0 && (
            <div className="p-4 text-center text-muted-foreground">
              Nenhum pedido encontrado.
            </div>
          )}
        </CardContent>
      </Card>
      
      <ApprovalModal
        isOpen={showModal}
        onClose={handleModalClose}
        stage="order"
        orderData={selectedOrder || {
          id: 'NOVO', 
          product: '', 
          quantity: 1, 
          customer: ''
        }}
        onApprove={handleApproveOrder}
        onNextStage={handleNextStage}
      />
    </div>
  );
};

export default OrdersPage;
