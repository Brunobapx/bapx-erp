import React from 'react';
import { StatusCards } from '@/components/Dashboard/StatusCards';
import { ProcessFunnel } from '@/components/Dashboard/ProcessFunnel';
import StageAlert from '@/components/Alerts/StageAlert';
import { ApprovalModal } from '@/components/Modals/ApprovalModal';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Clock } from 'lucide-react';
import { useDashboardStats } from '@/hooks/useDashboardStats';
import { Skeleton } from "@/components/ui/skeleton";

const Index = () => {
  const { stats, recentOrders, loading } = useDashboardStats();
  
  const [alerts, setAlerts] = React.useState([
    {
      id: '1',
      type: 'production' as const,
      message: 'Verificar pedidos parados na produção há mais de 2 dias.',
      time: '2 dias atrás'
    },
    {
      id: '2',
      type: 'route' as const,
      message: 'Revisar pedidos aguardando definição de rota.',
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

  const translateStatus = (status: string): string => {
    const statusTranslations: Record<string, string> = {
      'pending': 'Pendente',
      'in_production': 'Em Produção',
      'in_packaging': 'Em Embalagem',
      'packaged': 'Embalado',
      'released_for_sale': 'Liberado para Venda',
      'sale_confirmed': 'Venda Confirmada',
      'in_delivery': 'Em Entrega',
      'delivered': 'Entregue',
      'cancelled': 'Cancelado'
    };
    return statusTranslations[status] || status;
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Agora';
    if (diffInHours < 24) return `${diffInHours}h atrás`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays}d atrás`;
  };

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
            {loading ? (
              <div className="space-y-3">
                {Array.from({ length: 5 }).map((_, index) => (
                  <div key={index} className="p-3 border rounded-md">
                    <div className="flex justify-between items-start">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <Skeleton className="h-4 w-16" />
                          <Skeleton className="h-5 w-20" />
                        </div>
                        <Skeleton className="h-3 w-32" />
                      </div>
                      <Skeleton className="h-3 w-12" />
                    </div>
                  </div>
                ))}
              </div>
            ) : recentOrders.length > 0 ? (
              <div className="space-y-3">
                {recentOrders.map((order) => (
                  <div 
                    key={order.id}
                    className="p-3 border rounded-md hover:bg-accent/5 cursor-pointer transition-colors"
                    onClick={() => openModal('order')}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{order.order_number}</span>
                          <span className={`stage-badge badge-${order.status}`}>
                            {translateStatus(order.status)}
                          </span>
                        </div>
                        <div className="text-sm text-muted-foreground mt-1">
                          {order.client_name} - {formatCurrency(order.total_amount)}
                        </div>
                      </div>
                      <div className="text-xs text-muted-foreground flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {formatTimeAgo(order.created_at)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center p-4 text-muted-foreground">
                Nenhum pedido recente encontrado
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Entregas Programadas</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-2">
                <Skeleton className="h-6 w-full" />
                <Skeleton className="h-6 w-full" />
                <Skeleton className="h-6 w-full" />
              </div>
            ) : (
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Hoje</span>
                  <span className="font-medium">{stats.routes || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span>Amanhã</span>
                  <span className="font-medium">0</span>
                </div>
                <div className="flex justify-between">
                  <span>Esta semana</span>
                  <span className="font-medium">{stats.routes || 0}</span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Status Financeiro</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-2">
                <Skeleton className="h-6 w-full" />
                <Skeleton className="h-6 w-full" />
                <Skeleton className="h-6 w-full" />
              </div>
            ) : (
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>A receber</span>
                  <span className="font-medium">{formatCurrency(stats.total_receivables_amount)}</span>
                </div>
                <div className="flex justify-between">
                  <span>A pagar</span>
                  <span className="font-medium">{formatCurrency(stats.total_payables_amount)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Pendentes</span>
                  <span className="font-medium">{stats.pending_receivables}</span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Resumo Geral</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-2">
                <Skeleton className="h-6 w-full" />
                <Skeleton className="h-6 w-full" />
                <Skeleton className="h-6 w-full" />
              </div>
            ) : (
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Total Clientes</span>
                  <span className="font-medium">{stats.clients}</span>
                </div>
                <div className="flex justify-between">
                  <span>Total Produtos</span>
                  <span className="font-medium">{stats.products}</span>
                </div>
                <div className="flex justify-between">
                  <span>Total Vendas</span>
                  <span className="font-medium">{stats.sales}</span>
                </div>
              </div>
            )}
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
