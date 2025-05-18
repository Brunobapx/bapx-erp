
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ApprovalModal } from '@/components/Modals/ApprovalModal';
import { Truck, ChevronDown, Search, MapPin } from 'lucide-react';
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

const RoutesPage = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [alerts, setAlerts] = useState([
    {
      id: 'alert-1',
      type: 'route',
      message: 'Rota #RT-002 com prazo de entrega para hoje',
      time: 'Hoje'
    },
    {
      id: 'alert-2',
      type: 'route',
      message: 'Rota #RT-001 com confirmação de entrega pendente',
      time: '1 dia'
    }
  ]);

  // Mock routes data
  const routesItems = [
    { 
      id: 'RT-001', 
      orderId: 'PED-001',
      customer: 'Tech Solutions',
      address: 'Av. Paulista, 1000, São Paulo - SP',
      driver: 'João Silva',
      vehicle: 'Furgão - ABC-1234',
      scheduledDate: '19/05/2025',
      deliveryDate: '-',
      status: 'Em Trânsito'
    },
    { 
      id: 'RT-002', 
      orderId: 'PED-003',
      customer: 'City Hospital',
      address: 'Rua das Flores, 500, Rio de Janeiro - RJ',
      driver: 'Carlos Santos',
      vehicle: 'Van - DEF-5678',
      scheduledDate: '18/05/2025',
      deliveryDate: '-',
      status: 'Saiu para Entrega'
    },
    { 
      id: 'RT-003', 
      orderId: 'PED-004',
      customer: 'Global Foods',
      address: 'Rua Comércio, 230, Belo Horizonte - MG',
      driver: 'Pedro Almeida',
      vehicle: 'Caminhão - GHI-9012',
      scheduledDate: '17/05/2025',
      deliveryDate: '17/05/2025',
      status: 'Entregue'
    }
  ];

  // Filter items based on search query
  const filteredItems = routesItems.filter(item => {
    const searchString = searchQuery.toLowerCase();
    return (
      item.id.toLowerCase().includes(searchString) ||
      item.orderId.toLowerCase().includes(searchString) ||
      item.customer.toLowerCase().includes(searchString) ||
      item.address.toLowerCase().includes(searchString) ||
      item.driver.toLowerCase().includes(searchString) ||
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

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Roteirização</h1>
          <p className="text-muted-foreground">Gerencie todas as rotas de entrega.</p>
        </div>
        <Button onClick={() => setShowModal(true)}>
          <Truck className="mr-2 h-4 w-4" /> Nova Rota
        </Button>
      </div>
      
      <StageAlert alerts={alerts} onDismiss={handleDismissAlert} />
      
      <div className="flex flex-col sm:flex-row gap-4 sm:items-center justify-between">
        <div className="relative w-full sm:max-w-xs">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar rotas..."
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
              <DropdownMenuItem>Em Trânsito</DropdownMenuItem>
              <DropdownMenuItem>Saiu para Entrega</DropdownMenuItem>
              <DropdownMenuItem>Entregue</DropdownMenuItem>
              <DropdownMenuItem>Aguardando</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                Ordenar <ChevronDown className="ml-2 h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem>Data programada (próxima)</DropdownMenuItem>
              <DropdownMenuItem>Data programada (distante)</DropdownMenuItem>
              <DropdownMenuItem>Cliente (A-Z)</DropdownMenuItem>
              <DropdownMenuItem>Status</DropdownMenuItem>
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
                <TableHead>Endereço</TableHead>
                <TableHead>Motorista</TableHead>
                <TableHead>Veículo</TableHead>
                <TableHead>Data Programada</TableHead>
                <TableHead>Data Entrega</TableHead>
                <TableHead>Status</TableHead>
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
                  <TableCell className="max-w-xs truncate" title={item.address}>
                    <div className="flex items-center gap-1">
                      <MapPin className="h-3 w-3 flex-shrink-0" />
                      <span className="truncate">{item.address}</span>
                    </div>
                  </TableCell>
                  <TableCell>{item.driver}</TableCell>
                  <TableCell>{item.vehicle}</TableCell>
                  <TableCell>{item.scheduledDate}</TableCell>
                  <TableCell>{item.deliveryDate}</TableCell>
                  <TableCell>
                    <span className="stage-badge badge-route">
                      {item.status}
                    </span>
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
        onClose={() => setShowModal(false)}
        stage="route"
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

export default RoutesPage;
