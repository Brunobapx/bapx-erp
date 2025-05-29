
import React from 'react';
import { Package, Box, Truck, DollarSign, Route, ChartBar } from 'lucide-react';
import { Card, CardContent, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { useDashboardStats } from '@/hooks/useDashboardStats';
import { Skeleton } from "@/components/ui/skeleton";

type StatusCardProps = {
  title: string;
  count: number;
  icon: React.ReactNode;
  type: 'order' | 'production' | 'packaging' | 'sales' | 'finance' | 'route';
  pendingCount?: number;
};

const StatusCard = ({ title, count, icon, type, pendingCount }: StatusCardProps) => {
  const colorMap = {
    order: 'border-l-erp-order',
    production: 'border-l-erp-production',
    packaging: 'border-l-erp-packaging',
    sales: 'border-l-erp-sales',
    finance: 'border-l-erp-finance',
    route: 'border-l-erp-route',
  };

  const textColorMap = {
    order: 'text-erp-order',
    production: 'text-erp-production',
    packaging: 'text-erp-packaging',
    sales: 'text-erp-sales',
    finance: 'text-erp-finance',
    route: 'text-erp-route',
  };

  return (
    <Card className={cn("border-l-4", colorMap[type])}>
      <CardContent className="p-4">
        <div className="flex justify-between items-start">
          <div>
            <p className="text-sm text-muted-foreground">{title}</p>
            <CardTitle className="text-2xl font-bold mt-1">{count}</CardTitle>
            {pendingCount !== undefined && pendingCount > 0 && (
              <p className="text-xs text-erp-alert mt-1">
                {pendingCount} pendentes
              </p>
            )}
          </div>
          <div className={cn("p-2 rounded-full", `bg-${type}/10`, textColorMap[type])}>
            {icon}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export const StatusCards = () => {
  const { stats, loading, error } = useDashboardStats();

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {Array.from({ length: 6 }).map((_, index) => (
          <Card key={index} className="border-l-4">
            <CardContent className="p-4">
              <div className="flex justify-between items-start">
                <div className="space-y-2">
                  <Skeleton className="h-4 w-16" />
                  <Skeleton className="h-8 w-12" />
                  <Skeleton className="h-3 w-20" />
                </div>
                <Skeleton className="h-10 w-10 rounded-full" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center p-4 text-red-500">
        Erro ao carregar estatísticas: {error}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
      <StatusCard
        title="Pedidos"
        count={stats.orders}
        icon={<Package className="h-5 w-5" />}
        type="order"
        pendingCount={stats.pendingOrders}
      />
      <StatusCard
        title="Produção"
        count={stats.production}
        icon={<Box className="h-5 w-5" />}
        type="production"
        pendingCount={stats.pendingProduction}
      />
      <StatusCard
        title="Embalagem"
        count={stats.packaging}
        icon={<Box className="h-5 w-5" />}
        type="packaging"
        pendingCount={stats.pendingPackaging}
      />
      <StatusCard
        title="Vendas"
        count={stats.sales}
        icon={<DollarSign className="h-5 w-5" />}
        type="sales"
        pendingCount={stats.pendingSales}
      />
      <StatusCard
        title="Financeiro"
        count={stats.finance}
        icon={<DollarSign className="h-5 w-5" />}
        type="finance"
        pendingCount={stats.pendingFinance}
      />
      <StatusCard
        title="Rotas"
        count={stats.routes}
        icon={<Truck className="h-5 w-5" />}
        type="route"
        pendingCount={stats.pendingRoutes}
      />
    </div>
  );
};
