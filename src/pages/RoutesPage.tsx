
import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ApprovalModal } from '@/components/Modals/ApprovalModal';
import { Truck, ChevronDown, Search, MapPin, Plus, Route, Zap, Target } from 'lucide-react';
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
import VehicleTab from '@/components/Routes/VehicleTab';
import CreateRouteTab from '@/components/Routes/CreateRouteTab';
import RotasOtimizadasTab from '@/components/Routes/RotasOtimizadasTab';
import OtimizacaoRoteiroTab from '@/components/Routes/OtimizacaoRoteiroTab';
import { useRoutes } from '@/hooks/useRoutes';

const RoutesPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { routes, loading, fetchRoutes } = useRoutes();
  const [searchQuery, setSearchQuery] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [activeTab, setActiveTab] = useState('routes');
  
  // Receber dados da venda se vier da página de vendas
  const saleData = location.state?.saleData;
  const initialTab = location.state?.activeTab || 'routes';

  const [alerts, setAlerts] = useState([]);

  useEffect(() => {
    setActiveTab(initialTab);
    fetchRoutes();
  }, [initialTab]);

  // Usar dados reais do banco ao invés de mock data
  const filteredItems = routes.filter(route => {
    const searchString = searchQuery.toLowerCase();
    return (
      route.id.toLowerCase().includes(searchString) ||
      route.route_name.toLowerCase().includes(searchString) ||
      route.driver_name?.toLowerCase().includes(searchString) ||
      route.status.toLowerCase().includes(searchString)
    );
  });

  const handleItemClick = (item: any) => {
    setSelectedItem(item);
    setShowModal(true);
  };

  const handleDismissAlert = (id: string) => {
    setAlerts(alerts.filter(alert => alert.id !== id));
  };

  const handleNavigateToSales = () => {
    navigate('/sales');
  };

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Roteirização</h1>
          <p className="text-muted-foreground">Gerencie todas as rotas de entrega e veículos.</p>
        </div>
      </div>
      
      <StageAlert alerts={alerts} onDismiss={handleDismissAlert} />
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="routes" className="flex items-center gap-2">
            <Truck className="h-4 w-4" />
            Rotas
          </TabsTrigger>
          <TabsTrigger value="vehicles" className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Veículos
          </TabsTrigger>
          <TabsTrigger value="create-route" className="flex items-center gap-2">
            <Route className="h-4 w-4" />
            Criar Rotas
          </TabsTrigger>
          <TabsTrigger value="rotas-otimizadas" className="flex items-center gap-2">
            <Zap className="h-4 w-4" />
            Rotas Otimizadas
          </TabsTrigger>
          <TabsTrigger value="otimizacao-roteiro" className="flex items-center gap-2">
            <Target className="h-4 w-4" />
            Otimização OpenRoute
          </TabsTrigger>
        </TabsList>

        <TabsContent value="routes" className="space-y-6">
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
              
              <Button onClick={() => setShowModal(true)}>
                <Truck className="mr-2 h-4 w-4" /> Nova Rota
              </Button>
            </div>
          </div>
          
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Nome da Rota</TableHead>
                    <TableHead>Veículo</TableHead>
                    <TableHead>Motorista</TableHead>
                    <TableHead>Capacidade Usada</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredItems.map((route) => (
                    <TableRow 
                      key={route.id}
                      className="cursor-pointer hover:bg-accent/5"
                      onClick={() => handleItemClick(route)}
                    >
                      <TableCell className="font-medium">{route.id.slice(0, 8)}</TableCell>
                      <TableCell>{route.route_name}</TableCell>
                      <TableCell>
                        {route.vehicle?.model} - {route.vehicle?.license_plate}
                      </TableCell>
                      <TableCell>{route.driver_name || '-'}</TableCell>
                      <TableCell>{route.total_capacity_used.toFixed(2)} kg</TableCell>
                      <TableCell>
                        <span className="stage-badge badge-route">
                          {route.status === 'pending' ? 'Pendente' :
                           route.status === 'in_progress' ? 'Em Andamento' : 'Concluída'}
                        </span>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {filteredItems.length === 0 && !loading && (
                <div className="p-4 text-center text-muted-foreground">
                  Nenhuma rota encontrada.
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="vehicles">
          <VehicleTab />
        </TabsContent>

        <TabsContent value="create-route">
          <CreateRouteTab saleData={saleData} />
        </TabsContent>

        <TabsContent value="rotas-otimizadas">
          <RotasOtimizadasTab />
        </TabsContent>

        <TabsContent value="otimizacao-roteiro">
          <OtimizacaoRoteiroTab />
        </TabsContent>
      </Tabs>
      
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
