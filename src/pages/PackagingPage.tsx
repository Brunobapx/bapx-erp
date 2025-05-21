
import React, { useState } from 'react';
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
import StageAlert from '@/components/Alerts/StageAlert';

const PackagingPage = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [statusFilter, setStatusFilter] = useState('active'); // 'active', 'completed', or 'all'
  const [alerts, setAlerts] = useState([
    {
      id: 'alert-1',
      type: 'packaging' as const,
      message: 'Embalagem #EMB-003 aguardando confirmação há 1 dia',
      time: '1 dia'
    }
  ]);

  // Mock packaging data
  const packagingItems = [
    { 
      id: 'EMB-001', 
      productionId: 'PR-001',
      product: 'Server Hardware', 
      quantity: 10, 
      producedQuantity: 10,
      date: '18/05/2025',
      status: 'Embalado',
      quality: 'Aprovado',
      completed: true
    },
    { 
      id: 'EMB-002', 
      productionId: 'PR-003',
      product: 'Medical Equipment', 
      quantity: 5, 
      producedQuantity: 5,
      date: '17/05/2025',
      status: 'Embalado',
      quality: 'Aprovado',
      completed: true
    },
    { 
      id: 'EMB-003', 
      productionId: 'PR-004',
      product: 'Packaging Materials', 
      quantity: 100, 
      producedQuantity: 98,
      date: '16/05/2025',
      status: 'Aguardando Confirmação',
      quality: 'Pendente',
      completed: false
    },
    { 
      id: 'EMB-004', 
      productionId: 'PR-005',
      product: 'Desk Solutions', 
      quantity: 25, 
      producedQuantity: 0,
      date: '15/05/2025',
      status: 'Em Produção',
      quality: 'Pendente',
      completed: false
    }
  ];

  // Filter items based on search query and status filter
  const filteredItems = packagingItems.filter(item => {
    // Text search filter
    const searchString = searchQuery.toLowerCase();
    const matchesSearch =
      item.id.toLowerCase().includes(searchString) ||
      item.productionId.toLowerCase().includes(searchString) ||
      item.product.toLowerCase().includes(searchString) ||
      item.status.toLowerCase().includes(searchString);
    
    // Status filter
    if (statusFilter === 'active' && item.completed) {
      return false;
    }
    if (statusFilter === 'completed' && !item.completed) {
      return false;
    }

    return matchesSearch;
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
          <h1 className="text-2xl font-bold">Embalagem</h1>
          <p className="text-muted-foreground">Gerencie todos os produtos para embalagem.</p>
        </div>
        <Button onClick={() => setShowModal(true)}>
          <Package className="mr-2 h-4 w-4" /> Nova Embalagem
        </Button>
      </div>
      
      <StageAlert alerts={alerts} onDismiss={handleDismissAlert} />
      
      <div className="flex flex-col sm:flex-row gap-4 sm:items-center justify-between">
        <div className="relative w-full sm:max-w-xs">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar embalagens..."
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
              <DropdownMenuItem>Embalado</DropdownMenuItem>
              <DropdownMenuItem>Aguardando Confirmação</DropdownMenuItem>
              <DropdownMenuItem>Em Produção</DropdownMenuItem>
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
              <DropdownMenuItem>Produto (A-Z)</DropdownMenuItem>
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
                <TableHead>Produção</TableHead>
                <TableHead>Produto</TableHead>
                <TableHead className="text-center">Qtd Pedida</TableHead>
                <TableHead className="text-center">Qtd Produzida</TableHead>
                <TableHead>Data</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Qualidade</TableHead>
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
                  <TableCell>{item.productionId}</TableCell>
                  <TableCell>{item.product}</TableCell>
                  <TableCell className="text-center">{item.quantity}</TableCell>
                  <TableCell className="text-center">{item.producedQuantity}</TableCell>
                  <TableCell>{item.date}</TableCell>
                  <TableCell>
                    <span className="stage-badge badge-packaging">
                      {item.status}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className={`stage-badge ${item.quality === 'Aprovado' ? 'badge-sales' : 'badge-route'}`}>
                      {item.quality}
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
        stage="packaging"
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

export default PackagingPage;
