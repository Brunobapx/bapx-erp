
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ApprovalModal } from '@/components/Modals/ApprovalModal';
import { Package, ChevronDown, Search, Calendar, CreditCard, User } from 'lucide-react';
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

const OrdersPage = () => {
  const [searchQuery, setSearchQuery] = React.useState('');
  const [showModal, setShowModal] = React.useState(false);
  const [selectedOrder, setSelectedOrder] = React.useState(null);
  const [statusFilter, setStatusFilter] = React.useState('active'); // 'active', 'completed', or 'all'

  // Mock order data
  const orders = [
    { 
      id: 'PED-001', 
      customer: 'Tech Solutions', 
      product: 'Server Hardware', 
      quantity: 10, 
      date: '15/05/2025',
      status: 'Aguardando Produção',
      statusType: 'production',
      completed: false,
      deliveryDate: '30/05/2025',
      paymentMethod: 'Boleto Bancário',
      seller: 'João Silva'
    },
    { 
      id: 'PED-002', 
      customer: 'Green Energy Inc', 
      product: 'Solar Panels', 
      quantity: 50, 
      date: '14/05/2025',
      status: 'Em Produção',
      statusType: 'production',
      completed: false,
      deliveryDate: '28/05/2025',
      paymentMethod: 'Cartão de Crédito',
      seller: 'Maria Oliveira'
    },
    { 
      id: 'PED-003', 
      customer: 'City Hospital', 
      product: 'Medical Equipment', 
      quantity: 5, 
      date: '13/05/2025',
      status: 'Aguardando Embalagem',
      statusType: 'packaging',
      completed: true,
      deliveryDate: '25/05/2025',
      paymentMethod: 'Transferência Bancária',
      seller: 'Pedro Santos'
    },
    { 
      id: 'PED-004', 
      customer: 'Global Foods', 
      product: 'Packaging Materials', 
      quantity: 100, 
      date: '12/05/2025',
      status: 'Aguardando Venda',
      statusType: 'sales',
      completed: true,
      deliveryDate: '22/05/2025',
      paymentMethod: 'PIX',
      seller: 'Ana Costa'
    },
    { 
      id: 'PED-005', 
      customer: 'Modern Office', 
      product: 'Desk Solutions', 
      quantity: 25, 
      date: '11/05/2025',
      status: 'Financeiro Pendente',
      statusType: 'finance',
      completed: true,
      deliveryDate: '20/05/2025',
      paymentMethod: 'Boleto Bancário',
      seller: 'João Silva'
    },
    { 
      id: 'PED-006', 
      customer: 'Local Retailer', 
      product: 'Display Units', 
      quantity: 15, 
      date: '10/05/2025',
      status: 'Aguardando Rota',
      statusType: 'route',
      completed: true,
      deliveryDate: '18/05/2025',
      paymentMethod: 'Dinheiro',
      seller: 'Maria Oliveira'
    },
    { 
      id: 'PED-007', 
      customer: 'Education Center', 
      product: 'Interactive Boards', 
      quantity: 8, 
      date: '09/05/2025',
      status: 'Aguardando Produção',
      statusType: 'production',
      completed: false,
      deliveryDate: '16/05/2025',
      paymentMethod: 'Cartão de Débito',
      seller: 'Pedro Santos'
    },
  ];

  // Filter orders based on search query and status filter
  const filteredOrders = orders.filter(order => {
    // Text search filter
    const searchString = searchQuery.toLowerCase();
    const matchesSearch = 
      order.id.toLowerCase().includes(searchString) ||
      order.customer.toLowerCase().includes(searchString) ||
      order.product.toLowerCase().includes(searchString) ||
      order.status.toLowerCase().includes(searchString) ||
      order.seller.toLowerCase().includes(searchString);
    
    // Status filter
    if (statusFilter === 'active' && order.completed) {
      return false;
    }
    if (statusFilter === 'completed' && !order.completed) {
      return false;
    }

    return matchesSearch;
  });

  const handleOrderClick = (order: any) => {
    setSelectedOrder(order);
    setShowModal(true);
  };

  // Lista de clientes para o modal
  const clients = [
    { id: 1, name: 'Tech Solutions Ltda', value: '1', label: 'Tech Solutions Ltda' },
    { id: 2, name: 'Green Energy Inc', value: '2', label: 'Green Energy Inc' },
    { id: 3, name: 'City Hospital', value: '3', label: 'City Hospital' },
    { id: 4, name: 'Global Foods SA', value: '4', label: 'Global Foods SA' },
    { id: 5, name: 'Modern Office', value: '5', label: 'Modern Office' },
    { id: 6, name: 'Local Retailer', value: '6', label: 'Local Retailer' },
    { id: 7, name: 'Education Center', value: '7', label: 'Education Center' },
  ];
  
  // Lista de produtos para o modal
  const products = [
    { id: 1, name: 'Server Hardware X1', value: '1', label: 'Server Hardware X1' },
    { id: 2, name: 'Solar Panel 250W', value: '2', label: 'Solar Panel 250W' },
    { id: 3, name: 'Equipamento Médico M3', value: '3', label: 'Equipamento Médico M3' },
    { id: 4, name: 'Material de Embalagem', value: '4', label: 'Material de Embalagem' },
    { id: 5, name: 'Desk Solutions', value: '5', label: 'Desk Solutions' },
    { id: 6, name: 'Display Units', value: '6', label: 'Display Units' },
    { id: 7, name: 'Interactive Boards', value: '7', label: 'Interactive Boards' },
  ];

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Pedidos</h1>
          <p className="text-muted-foreground">Gerencie todos os pedidos do sistema.</p>
        </div>
        <Button onClick={() => { setSelectedOrder(null); setShowModal(true); }}>
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
              <DropdownMenuItem>Aguardando Produção</DropdownMenuItem>
              <DropdownMenuItem>Em Produção</DropdownMenuItem>
              <DropdownMenuItem>Aguardando Embalagem</DropdownMenuItem>
              <DropdownMenuItem>Aguardando Venda</DropdownMenuItem>
              <DropdownMenuItem>Financeiro Pendente</DropdownMenuItem>
              <DropdownMenuItem>Aguardando Rota</DropdownMenuItem>
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
                <TableHead>
                  <div className="flex items-center">
                    <Calendar className="mr-1 h-4 w-4" /> Entrega
                  </div>
                </TableHead>
                <TableHead>
                  <div className="flex items-center">
                    <User className="mr-1 h-4 w-4" /> Vendedor
                  </div>
                </TableHead>
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
                  <TableCell>{order.deliveryDate}</TableCell>
                  <TableCell>{order.seller}</TableCell>
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
        onClose={() => setShowModal(false)}
        stage="order"
        orderData={selectedOrder || {
          id: 'NOVO', 
          product: '', 
          quantity: 1, 
          customer: '',
          deliveryDate: null,
          paymentMethod: '',
          seller: ''
        }}
        clientsData={clients}
        productsData={products}
      />
    </div>
  );
};

export default OrdersPage;
