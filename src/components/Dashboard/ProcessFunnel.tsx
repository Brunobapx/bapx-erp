
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { useDashboardStats } from '@/hooks/useDashboardStats';
import { Skeleton } from "@/components/ui/skeleton";

type ProcessData = {
  stage: string;
  count: number;
  color: string;
  percentage?: number;
};

export const ProcessFunnel = () => {
  const { stats, loading, error } = useDashboardStats();

  if (loading) {
    return (
      <Card className="col-span-1 md:col-span-2 lg:col-span-4">
        <CardHeader>
          <CardTitle>Funil de Processos</CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-6 items-center">
            <div className="w-full md:w-1/2 h-64">
              <Skeleton className="w-full h-full rounded-full" />
            </div>
            <div className="w-full md:w-1/2 space-y-4">
              {Array.from({ length: 6 }).map((_, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Skeleton className="w-3 h-3 rounded-full" />
                    <Skeleton className="h-4 w-20" />
                  </div>
                  <div className="flex items-center gap-2">
                    <Skeleton className="h-4 w-8" />
                    <Skeleton className="h-4 w-12" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="col-span-1 md:col-span-2 lg:col-span-4">
        <CardHeader>
          <CardTitle>Funil de Processos</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center p-4 text-red-500">
            Erro ao carregar dados do funil de processos
          </div>
        </CardContent>
      </Card>
    );
  }

  const processData: ProcessData[] = [
    { stage: 'Pedidos', count: stats.orders, color: '#9B66FF' },
    { stage: 'Produção', count: stats.production, color: '#4ECDC4' },
    { stage: 'Embalagem', count: stats.packaging, color: '#FF8B64' },
    { stage: 'Vendas', count: stats.sales, color: '#649FFF' },
    { stage: 'Financeiro', count: stats.finance, color: '#41B883' },
    { stage: 'Rotas', count: stats.routes, color: '#FFC75F' },
  ];

  // Calculate total count for percentage calculation
  const total = processData.reduce((acc, curr) => acc + curr.count, 0);
  
  // Add percentage to each item
  const dataWithPercentage = processData.map(item => ({
    ...item,
    percentage: total > 0 ? Math.round((item.count / total) * 100) : 0
  }));

  // Filter out items with 0 count for the chart
  const chartData = dataWithPercentage.filter(item => item.count > 0);

  return (
    <Card className="col-span-1 md:col-span-2 lg:col-span-4">
      <CardHeader>
        <CardTitle>Funil de Processos</CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        <div className="flex flex-col md:flex-row gap-6 items-center">
          <div className="w-full md:w-1/2 h-64">
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={chartData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={80}
                    innerRadius={40}
                    fill="#8884d8"
                    dataKey="count"
                    nameKey="stage"
                  >
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value: number, name: string) => [
                      `${value} (${dataWithPercentage.find(item => item.stage === name)?.percentage}%)`, 
                      name
                    ]}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-muted-foreground">
                Nenhum dado disponível
              </div>
            )}
          </div>
          <div className="w-full md:w-1/2">
            <div className="space-y-4">
              {dataWithPercentage.map((item, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div 
                      className="w-3 h-3 rounded-full" 
                      style={{ backgroundColor: item.color }}
                    />
                    <span className="text-sm font-medium">{item.stage}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">{item.count}</span>
                    <span className="text-xs text-muted-foreground">
                      ({item.percentage}%)
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
