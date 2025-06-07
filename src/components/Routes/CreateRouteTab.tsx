import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { MapPin, Package, Truck } from 'lucide-react';
import { useRoutes, OrderForRoute } from '@/hooks/useRoutes';
import { useVehicles } from '@/hooks/useVehicles';

interface CreateRouteTabProps {
  saleData?: {
    order_id: string;
    sale_id: string;
    sale_number: string;
    client_name: string;
    total_amount: number;
  };
}

const CreateRouteTab = ({ saleData }: CreateRouteTabProps) => {
  const { availableOrders, routes, loading, fetchAvailableOrders, fetchRoutes, createOptimizedRoutes } = useRoutes();
  const { vehicles, fetchVehicles } = useVehicles();
  
  const [selectedOrders, setSelectedOrders] = useState<string[]>([]);
  const [selectedVehicle, setSelectedVehicle] = useState<string>('');

  useEffect(() => {
    console.log('CreateRouteTab mounted with saleData:', saleData);
    
    // Se há dados de venda, buscar pedidos incluindo o específico
    if (saleData?.order_id) {
      fetchAvailableOrders(saleData.order_id);
    } else {
      fetchAvailableOrders();
    }
    
    fetchRoutes();
    fetchVehicles();
  }, [saleData]);

  useEffect(() => {
    // Pré-selecionar o pedido da venda quando os pedidos estiverem carregados
    if (saleData?.order_id && availableOrders.length > 0) {
      const orderExists = availableOrders.find(order => order.id === saleData.order_id);
      if (orderExists && !selectedOrders.includes(saleData.order_id)) {
        setSelectedOrders([saleData.order_id]);
      }
    }
  }, [saleData, availableOrders]);

  const handleOrderSelection = (orderId: string, checked: boolean) => {
    if (checked) {
      setSelectedOrders([...selectedOrders, orderId]);
    } else {
      setSelectedOrders(selectedOrders.filter(id => id !== orderId));
    }
  };

  const handleCreateRoute = async () => {
    if (selectedOrders.length === 0 || !selectedVehicle) {
      return;
    }

    try {
      await createOptimizedRoutes(selectedOrders, selectedVehicle);
      setSelectedOrders([]);
      setSelectedVehicle('');
    } catch (error) {
      console.error('Erro ao criar rota:', error);
    }
  };

  const calculateTotalWeight = () => {
    return availableOrders
      .filter(order => selectedOrders.includes(order.id))
      .reduce((sum, order) => sum + order.total_weight, 0);
  };

  const getSelectedVehicleCapacity = () => {
    const vehicle = vehicles.find(v => v.id === selectedVehicle);
    return vehicle ? vehicle.capacity : 0;
  };

  const totalWeight = calculateTotalWeight();
  const vehicleCapacity = getSelectedVehicleCapacity();
  const isOverCapacity = totalWeight > vehicleCapacity;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold">Criar Rotas</h2>
        <p className="text-muted-foreground">
          Selecione pedidos e veículo para criar uma rota otimizada
          {saleData && (
            <span className="text-blue-600 ml-2">
              • Venda {saleData.sale_number} selecionada
            </span>
          )}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Pedidos Disponíveis
                {saleData && (
                  <span className="text-sm text-blue-600 font-normal">
                    (Incluindo pedido da venda {saleData.sale_number})
                  </span>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">
                      <Checkbox
                        checked={selectedOrders.length === availableOrders.length && availableOrders.length > 0}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setSelectedOrders(availableOrders.map(o => o.id));
                          } else {
                            setSelectedOrders([]);
                          }
                        }}
                      />
                    </TableHead>
                    <TableHead>Pedido</TableHead>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Endereço</TableHead>
                    <TableHead>Peso (kg)</TableHead>
                    <TableHead>Venda</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {availableOrders.map((order) => (
                    <TableRow 
                      key={order.id}
                      className={saleData?.order_id === order.id ? 'bg-blue-50' : ''}
                    >
                      <TableCell>
                        <Checkbox
                          checked={selectedOrders.includes(order.id)}
                          onCheckedChange={(checked) => handleOrderSelection(order.id, !!checked)}
                        />
                      </TableCell>
                      <TableCell className="font-medium">{order.order_number}</TableCell>
                      <TableCell>{order.client_name}</TableCell>
                      <TableCell className="max-w-xs truncate" title={order.delivery_address}>
                        <div className="flex items-center gap-1">
                          <MapPin className="h-3 w-3 flex-shrink-0" />
                          <span className="truncate">{order.delivery_address}</span>
                        </div>
                      </TableCell>
                      <TableCell>{order.total_weight.toFixed(2)}</TableCell>
                      <TableCell>
                        {order.sale_number ? (
                          <span className="text-blue-600 font-medium">
                            {order.sale_number}
                          </span>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              
              {availableOrders.length === 0 && !loading && (
                <div className="text-center py-8 text-muted-foreground">
                  Nenhum pedido disponível para roteirização.
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Truck className="h-5 w-5" />
                Selecionar Veículo
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Select value={selectedVehicle} onValueChange={setSelectedVehicle}>
                <SelectTrigger>
                  <SelectValue placeholder="Escolha um veículo" />
                </SelectTrigger>
                <SelectContent>
                  {vehicles.filter(v => v.status === 'active').map((vehicle) => (
                    <SelectItem key={vehicle.id} value={vehicle.id}>
                      {vehicle.model} - {vehicle.license_plate} ({vehicle.capacity}kg)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {selectedVehicle && (
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Peso selecionado:</span>
                    <span className={isOverCapacity ? 'text-red-600 font-medium' : ''}>
                      {totalWeight.toFixed(2)} kg
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Capacidade do veículo:</span>
                    <span>{vehicleCapacity} kg</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Espaço restante:</span>
                    <span className={isOverCapacity ? 'text-red-600 font-medium' : 'text-green-600'}>
                      {(vehicleCapacity - totalWeight).toFixed(2)} kg
                    </span>
                  </div>
                  
                  {isOverCapacity && (
                    <div className="text-red-600 text-xs bg-red-50 p-2 rounded">
                      Atenção: O peso total excede a capacidade do veículo!
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Resumo da Rota</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Pedidos selecionados:</span>
                  <span>{selectedOrders.length}</span>
                </div>
                <div className="flex justify-between">
                  <span>Peso total:</span>
                  <span>{totalWeight.toFixed(2)} kg</span>
                </div>
                {saleData && selectedOrders.includes(saleData.order_id) && (
                  <div className="text-blue-600 text-xs bg-blue-50 p-2 rounded">
                    Incluindo pedido da venda {saleData.sale_number}
                  </div>
                )}
              </div>
              
              <Button 
                onClick={handleCreateRoute}
                disabled={selectedOrders.length === 0 || !selectedVehicle || isOverCapacity || loading}
                className="w-full"
              >
                {loading ? 'Criando Rota...' : 'Criar Rota Otimizada'}
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Rotas Recentes</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {routes.slice(0, 3).map((route) => (
                  <div key={route.id} className="flex items-center justify-between p-2 bg-accent rounded">
                    <div className="text-sm">
                      <div className="font-medium">{route.route_name}</div>
                      <div className="text-muted-foreground">
                        {route.vehicle?.model} - {route.total_capacity_used.toFixed(2)}kg
                      </div>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded ${
                      route.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                      route.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                      'bg-green-100 text-green-800'
                    }`}>
                      {route.status === 'pending' ? 'Pendente' :
                       route.status === 'in_progress' ? 'Em Andamento' : 'Concluída'}
                    </span>
                  </div>
                ))}
                
                {routes.length === 0 && (
                  <div className="text-center py-4 text-muted-foreground text-sm">
                    Nenhuma rota criada ainda.
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default CreateRouteTab;
