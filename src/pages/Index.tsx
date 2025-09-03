import React from 'react';
import { StatusCards } from '@/components/Dashboard/StatusCards';
import { ProcessFunnel } from '@/components/Dashboard/ProcessFunnel';
import { ApprovalModal } from '@/components/Modals/ApprovalModal';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Clock } from 'lucide-react';
import { useDashboardStats } from '@/hooks/useDashboardStats';
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from '@/components/Auth/AuthProvider';
const Index = () => {
  const {
    stats,
    sellerStats,
    recentOrders,
    loading
  } = useDashboardStats();
  const {
    isSeller,
    userRole
  } = useAuth();
  const [showApprovalModal, setShowApprovalModal] = React.useState(false);
  const [currentStage, setCurrentStage] = React.useState<'order' | 'production' | 'packaging' | 'sales' | 'finance' | 'route'>('order');
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
  return <div className="p-4 sm:p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">
          {isSeller ? 'Painel do Vendedor' : 'Dashboard'}
        </h1>
        <div>
          
        </div>
      </div>

      
      {!isSeller && <StatusCards />}
      
      <div className="grid grid-cols-1 lg:grid-cols-6 gap-4">
        {!isSeller && <ProcessFunnel />}
        
        <Card className={`col-span-1 ${isSeller ? 'lg:col-span-3' : 'lg:col-span-2'}`}>
          <CardHeader>
            <CardTitle>{isSeller ? 'Meus Pedidos Recentes' : 'Pedidos Recentes'}</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? <div className="space-y-3">
                {Array.from({
              length: 5
            }).map((_, index) => <div key={index} className="p-3 border rounded-md">
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
                  </div>)}
              </div> : recentOrders.length > 0 ? <div className="space-y-3">
                {recentOrders.map(order => <div key={order.id} className="p-3 border rounded-md hover:bg-accent/5 cursor-pointer transition-colors" onClick={() => openModal('order')}>
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
                  </div>)}
              </div> : <div className="text-center p-4 text-muted-foreground">
                Nenhum pedido recente encontrado
              </div>}
          </CardContent>
        </Card>
        
        {isSeller && <Card className="col-span-1 lg:col-span-3">
            <CardHeader>
              <CardTitle>Minhas Comissões</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? <div className="space-y-2">
                  <Skeleton className="h-6 w-full" />
                  <Skeleton className="h-6 w-full" />
                  <Skeleton className="h-6 w-full" />
                </div> : <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Comissão do Mês</span>
                    <span className="font-medium">{formatCurrency(sellerStats.monthlyCommission)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Comissões Pendentes</span>
                    <span className="font-medium">{formatCurrency(sellerStats.pendingCommissions)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Total de Vendas</span>
                    <span className="font-medium">{formatCurrency(sellerStats.totalSales)}</span>
                  </div>
                </div>}
            </CardContent>
          </Card>}
      </div>
      
      {isSeller ? <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <Card>
            <CardHeader>
              <CardTitle>Meus Pedidos</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? <div className="space-y-2">
                  <Skeleton className="h-6 w-full" />
                  <Skeleton className="h-6 w-full" />
                  <Skeleton className="h-6 w-full" />
                </div> : <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Total de Pedidos</span>
                    <span className="font-medium">{sellerStats.myOrders}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Vendas Realizadas</span>
                    <span className="font-medium">{formatCurrency(sellerStats.totalSales)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Meta do Mês</span>
                    <span className="font-medium">R$ 50.000</span>
                  </div>
                </div>}
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Performance</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? <div className="space-y-2">
                  <Skeleton className="h-6 w-full" />
                  <Skeleton className="h-6 w-full" />
                  <Skeleton className="h-6 w-full" />
                </div> : <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Taxa de Conversão</span>
                    <span className="font-medium">85%</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Ticket Médio</span>
                    <span className="font-medium">{sellerStats.myOrders > 0 ? formatCurrency(sellerStats.totalSales / sellerStats.myOrders) : 'R$ 0,00'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Ranking</span>
                    <span className="font-medium">#2</span>
                  </div>
                </div>}
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Próximas Ações</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Follow-ups Pendentes</span>
                  <span className="font-medium">3</span>
                </div>
                <div className="flex justify-between">
                  <span>Propostas Enviadas</span>
                  <span className="font-medium">2</span>
                </div>
                <div className="flex justify-between">
                  <span>Visitas Agendadas</span>
                  <span className="font-medium">1</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div> : <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Entregas Programadas</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? <div className="space-y-2">
                <Skeleton className="h-6 w-full" />
                <Skeleton className="h-6 w-full" />
                <Skeleton className="h-6 w-full" />
              </div> : <div className="space-y-2">
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
              </div>}
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Status Financeiro</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? <div className="space-y-2">
                <Skeleton className="h-6 w-full" />
                <Skeleton className="h-6 w-full" />
                <Skeleton className="h-6 w-full" />
              </div> : <div className="space-y-2">
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
              </div>}
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Resumo Geral</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? <div className="space-y-2">
                <Skeleton className="h-6 w-full" />
                <Skeleton className="h-6 w-full" />
                <Skeleton className="h-6 w-full" />
              </div> : <div className="space-y-2">
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
              </div>}
          </CardContent>
        </Card>
        </div>}
      
      <ApprovalModal isOpen={showApprovalModal} onClose={() => setShowApprovalModal(false)} stage={currentStage} />
    </div>;
};
export default Index;