import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

interface DistributionChartsProps {
  priorityDistribution: { [key: string]: number };
  typeDistribution: { [key: string]: number };
}

const PRIORITY_COLORS = {
  'Crítica': '#ef4444',
  'Alta': '#f97316', 
  'Média': '#eab308',
  'Baixa': '#22c55e'
};

const TYPE_COLORS = ['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444', '#6b7280'];

export const DistributionCharts: React.FC<DistributionChartsProps> = ({ 
  priorityDistribution, 
  typeDistribution 
}) => {
  const priorityData = Object.entries(priorityDistribution).map(([name, value]) => ({
    name,
    value,
    color: PRIORITY_COLORS[name as keyof typeof PRIORITY_COLORS] || '#6b7280'
  }));

  const typeData = Object.entries(typeDistribution).map(([name, value], index) => ({
    name,
    value,
    color: TYPE_COLORS[index % TYPE_COLORS.length]
  }));

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Distribuição por Prioridade</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={priorityData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {priorityData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Distribuição por Tipo de Serviço</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={typeData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} />
              <YAxis />
              <Tooltip />
              <Bar dataKey="value" fill="#3b82f6" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
};