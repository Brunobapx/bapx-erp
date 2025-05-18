
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

type ProcessData = {
  stage: string;
  count: number;
  color: string;
  percentage?: number; // Calculated based on total
};

export const ProcessFunnel = () => {
  const processData: ProcessData[] = [
    { stage: 'Pedidos', count: 24, color: '#9B66FF' },
    { stage: 'Produção', count: 18, color: '#4ECDC4' },
    { stage: 'Embalagem', count: 15, color: '#FF8B64' },
    { stage: 'Vendas', count: 20, color: '#649FFF' },
    { stage: 'Financeiro', count: 16, color: '#41B883' },
    { stage: 'Rotas', count: 12, color: '#FFC75F' },
  ];

  // Calculate total count for percentage calculation
  const total = processData.reduce((acc, curr) => acc + curr.count, 0);
  
  // Add percentage to each item
  const dataWithPercentage = processData.map(item => ({
    ...item,
    percentage: Math.round((item.count / total) * 100)
  }));

  return (
    <Card className="col-span-1 md:col-span-2 lg:col-span-4">
      <CardHeader>
        <CardTitle>Funil de Processos</CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        <div className="flex flex-col md:flex-row gap-6 items-center">
          <div className="w-full md:w-1/2 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={dataWithPercentage}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  outerRadius={80}
                  innerRadius={40}
                  fill="#8884d8"
                  dataKey="count"
                  nameKey="stage"
                >
                  {dataWithPercentage.map((entry, index) => (
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
