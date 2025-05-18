
import React from 'react';
import { StatusCards } from '@/components/Dashboard/StatusCards';
import { ProcessFunnel } from '@/components/Dashboard/ProcessFunnel';
import StageAlert from '@/components/Alerts/StageAlert';
import { ApprovalModal } from '@/components/Modals/ApprovalModal';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle, Clock, Package } from 'lucide-react';

const Index = () => {
  const [alerts, setAlerts] = React.useState([
    {
      id: '1',
      type: 'production' as const,
      message: 'Pedido PED-005 está parado na produção há 2 dias.',
      time: '2 dias atrás'
    },
    {
      id: '2',
      type: 'route' as const,
      message: 'Pedido PED-012 aguardando definição de rota.',
      time: '5 horas atrás'
    }
  ]);

  const [showApprovalModal, setShowApprovalModal] = React.useState(false);
  const [currentStage, setCurrentStage] = React.useState<'order' | 'production' | 'packaging' | 'sales' | 'finance' | 'route'>('order');

  const handleDismissAlert = (id: string) => {
    setAlerts(alerts.filter(alert => alert.id !== id));
  };

  const openModal = (stage: 'order' | 'production' | 'packaging' | 'sales' | 'finance' | 'route') => {
    setCurrentStage(stage);
    setShowApprovalModal(true);
  };

  // Mock data for recent orders
  const recentOrders = [
    { id: 'PED-024', customer: 'Tech Solutions', product: 'Server Hardware', status: 'order', time: '3h atrás' },
    { id: 'PED-023', customer: 'Green Energy Inc', product: 'Solar Panels', status: 'production', time: '5h atrás' },
    { id: 'PED-022', customer: 'City Hospital', product: 'Medical Equipment', status: 'packaging', time: '8h atrás' },
    { id: 'PED-021', customer: 'Global Foods', product: 'Packaging Materials', status: 'sales', time: '1d atrás' },
    { id: 'PED-020', customer: 'Modern Office', product: 'Desk Solutions', status: 'finance', time: '1d atrás' },
  ];

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <div>
          <Button onClick={() => openModal('order')}>Novo Pedido</Button>
        </div>
      </div>
      
      <StageAlert alerts={alerts} onDismiss={handleDismissAlert} />

      <StatusCards />
      
      <div className="grid grid-cols-1 lg:grid-cols-6 gap-4">
        <ProcessFunnel />
        
        <Card className="col-span-1 lg:col-span-2">
          <CardHeader>
            <CardTitle>Pedidos Recentes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentOrders.map((order) => (
                <div 
                  key={order.id}
                  className="p-3 border rounded-md hover:bg-accent/5 cursor-pointer transition-colors"
                  onClick={() => openModal(order.status as any)}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="flex items-center gap-1">
                        <span className="font-medium">{order.id}</span>
                        <span className={`stage-badge badge-${order.status}`}>
                          {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                        </span>
                      </div>
                      <div className="text-sm text-muted-foreground mt-1">
                        {order.customer} - {order.product}
                      </div>
                    </div>
                    <div className="text-xs text-muted-foreground flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {order.time}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Pedidos por Categoria</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>Hardware</span>
                <span className="font-medium">12</span>
              </div>
              <div className="flex justify-between">
                <span>Software</span>
                <span className="font-medium">8</span>
              </div>
              <div className="flex justify-between">
                <span>Serviços</span>
                <span className="font-medium">4</span>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Entregas Programadas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>Hoje</span>
                <span className="font-medium">3</span>
              </div>
              <div className="flex justify-between">
                <span>Amanhã</span>
                <span className="font-medium">5</span>
              </div>
              <div className="flex justify-between">
                <span>Esta semana</span>
                <span className="font-medium">12</span>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Status Financeiro</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>A receber (7d)</span>
                <span className="font-medium">R$ 12.450</span>
              </div>
              <div className="flex justify-between">
                <span>A receber (30d)</span>
                <span className="font-medium">R$ 45.820</span>
              </div>
              <div className="flex justify-between">
                <span>Recebido (mês)</span>
                <span className="font-medium">R$ 38.670</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      
      <ApprovalModal 
        isOpen={showApprovalModal}
        onClose={() => setShowApprovalModal(false)}
        stage={currentStage}
      />
    </div>
  );
};

export default Index;
