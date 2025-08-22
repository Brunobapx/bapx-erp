import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { format, startOfWeek, endOfWeek, eachDayOfInterval, eachWeekOfInterval, startOfMonth, endOfMonth, eachMonthOfInterval } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { UnifiedFinancialEntry } from '@/hooks/useUnifiedFinancialEntries';
import { formatCurrency } from '@/utils/formatCurrency';

interface FinancialChartProps {
  data: UnifiedFinancialEntry[];
  period: 'today' | 'week' | 'month' | 'custom';
  totalEntradas: number;
  totalSaidas: number;
}

export const FinancialChart: React.FC<FinancialChartProps> = ({
  data,
  period,
  totalEntradas,
  totalSaidas
}) => {
  const chartData = useMemo(() => {
    if (!data || data.length === 0) return [];

    const today = new Date();
    let intervals: Date[] = [];
    let formatPattern = 'dd/MM';

    // Definir intervalos baseado no período
    switch (period) {
      case 'today':
        return [{
          period: 'Hoje',
          entradas: totalEntradas,
          saidas: totalSaidas
        }];
      
      case 'week':
        const weekStart = startOfWeek(today, { locale: ptBR });
        const weekEnd = endOfWeek(today, { locale: ptBR });
        intervals = eachDayOfInterval({ start: weekStart, end: weekEnd });
        formatPattern = 'EEE';
        break;
      
      case 'month':
        const monthStart = startOfMonth(today);
        const monthEnd = endOfMonth(today);
        intervals = eachWeekOfInterval({ start: monthStart, end: monthEnd });
        formatPattern = 'dd/MM';
        break;
      
      case 'custom':
        // Para período customizado, agrupar por semana se mais de 30 dias, senão por dia
        const customStart = new Date(Math.min(...data.map(d => new Date(d.due_date).getTime())));
        const customEnd = new Date(Math.max(...data.map(d => new Date(d.due_date).getTime())));
        const daysDiff = Math.ceil((customEnd.getTime() - customStart.getTime()) / (1000 * 60 * 60 * 24));
        
        if (daysDiff > 30) {
          intervals = eachWeekOfInterval({ start: customStart, end: customEnd });
          formatPattern = 'dd/MM';
        } else {
          intervals = eachDayOfInterval({ start: customStart, end: customEnd });
          formatPattern = 'dd/MM';
        }
        break;
    }

    // Agrupar dados por período
    return intervals.map(intervalDate => {
      const periodLabel = format(intervalDate, formatPattern, { locale: ptBR });
      
      const periodEntries = data.filter(entry => {
        const entryDate = new Date(entry.due_date);
        
        if (period === 'week') {
          return format(entryDate, 'yyyy-MM-dd') === format(intervalDate, 'yyyy-MM-dd');
        } else {
          // Para semanas, verificar se a entrada está na semana
          const weekStart = startOfWeek(intervalDate, { locale: ptBR });
          const weekEnd = endOfWeek(intervalDate, { locale: ptBR });
          return entryDate >= weekStart && entryDate <= weekEnd;
        }
      });

      const entradas = periodEntries
        .filter(entry => entry.type === 'receivable')
        .reduce((sum, entry) => sum + Number(entry.amount), 0);
      
      const saidas = periodEntries
        .filter(entry => entry.type === 'payable')
        .reduce((sum, entry) => sum + Number(entry.amount), 0);

      return {
        period: periodLabel,
        entradas,
        saidas
      };
    });
  }, [data, period, totalEntradas, totalSaidas]);

  // Using centralized formatCurrency function

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-background border border-border rounded-lg p-3 shadow-lg">
          <p className="font-medium text-foreground mb-2">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {entry.name}: {formatCurrency(entry.value)}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <span>Entradas vs Saídas</span>
          <div className="text-sm text-muted-foreground font-normal">
            (Saldo: {formatCurrency(totalEntradas - totalSaidas)})
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-80 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis 
                dataKey="period" 
                className="text-muted-foreground"
                fontSize={12}
              />
              <YAxis 
                className="text-muted-foreground"
                fontSize={12}
                tickFormatter={(value) => formatCurrency(value)}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <Bar 
                dataKey="entradas" 
                name="Entradas" 
                fill="hsl(var(--success))" 
                radius={[4, 4, 0, 0]}
              />
              <Bar 
                dataKey="saidas" 
                name="Saídas" 
                fill="hsl(var(--destructive))" 
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};