
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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

const OrdersPage = () => {
  const [searchQuery, setSearchQuery] = React.useState('');
  const [showModal, setShowModal] = React.useState(false);
  const [selectedOrder, setSelectedOrder] = React.useState(null);

  // Mock order data
  const orders = [
    { 
      id: 'PED-001', 
      customer: 'Tech Solutions', 
      product: 'Server Hardware', 
      quantity: 10, 
      date: '15/05/2025',
      status: 'Aguardando Produção',
      statusType: 'production'
    },
    { 
      id: 'PED-002', 
      customer: 'Green Energy Inc', 
      product: 'Solar Panels', 
      quantity: 50, 
      date: '14/05/2025',
      status: 'Em Produção',
      statusType: 'production'
    },
    { 
      id: 'PED-003', 
      customer: 'City Hospital', 
      product: 'Medical Equipment', 
      quantity: 5, 
      date: '13/05/2025',
      status: 'Aguardando Embalagem',
      statusType: 'packaging'
    },
    { 
      id: 'PED-004', 
      customer: 'Global Foods', 
      product: 'Packaging Materials', 
      quantity: 100, 
      date: '12/05/2025',
      status: 'Aguardando Venda',
      statusType: 'sales'
    },
    { 
      id: 'PED-005', 
      customer: 'Modern Office', 
      product: 'Desk Solutions', 
      quantity: 25, 
      date: '11/05/2025',
      status: 'Financeiro Pendente',
      statusType: 'finance'
    },
    { 
      id: 'PED-006', 
      customer: 'Local Retailer', 
      product: 'Display Units', 
      quantity: 15, 
      date: '10/05/2025',
      status: 'Aguardando Rota',
      statusType: 'route'
    },
    { 
      id: 'PED-007', 
      customer: 'Education Center', 
      product: 'Interactive Boards', 
      quantity: 8, 
      date: '09/05/2025',
      status: 'Aguardando Produção',
      statusType: 'production'
    },
  ];

  // Filter orders based on search query
  const filteredOrders = orders.filter(order => {
    const searchString = searchQuery.toLowerCase();
    return (
      order.id.toLowerCase().includes(searchString) ||
      order.customer.toLowerCase().includes(searchString) ||
      order.product.toLowerCase().includes(searchString) ||
      order.status.toLowerCase().includes(searchString)
    );
  });

  const handleOrderClick = (order: any) => {
    setSelectedOrder(order);
    setShowModal(true);
  };

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Pedidos</h1>
          <p className="text-muted-foreground">Gerencie todos os pedidos do sistema.</p>
        </div>
        <Button onClick={() => setShowModal(true)}>
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
              <DropdownMenuItem>Todos</DropdownMenuItem>
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
        onClose={() => setShowModal(false)}
        stage="order"
        orderData={selectedOrder || {
          id: 'NOVO', 
          product: '', 
          quantity: 1, 
          customer: ''
        }}
      />
    </div>
  );
};

export default OrdersPage;
