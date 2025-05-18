
import React from 'react';
import { Package, Box, Truck, DollarSign, Route, ChartBar } from 'lucide-react';
import { Card, CardContent, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

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
            {pendingCount !== undefined && (
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
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
      <StatusCard
        title="Pedidos"
        count={24}
        icon={<Package className="h-5 w-5" />}
        type="order"
        pendingCount={5}
      />
      <StatusCard
        title="Produção"
        count={18}
        icon={<Box className="h-5 w-5" />}
        type="production"
        pendingCount={3}
      />
      <StatusCard
        title="Embalagem"
        count={15}
        icon={<Box className="h-5 w-5" />}
        type="packaging"
        pendingCount={2}
      />
      <StatusCard
        title="Vendas"
        count={20}
        icon={<DollarSign className="h-5 w-5" />}
        type="sales"
        pendingCount={0}
      />
      <StatusCard
        title="Financeiro"
        count={16}
        icon={<DollarSign className="h-5 w-5" />}
        type="finance"
        pendingCount={1}
      />
      <StatusCard
        title="Rotas"
        count={12}
        icon={<Truck className="h-5 w-5" />}
        type="route"
        pendingCount={4}
      />
    </div>
  );
};
