import React, { useState, useMemo } from 'react';
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DatePicker } from "@/components/ui/date-picker";
import { Button } from "@/components/ui/button";
import { Calendar, TrendingUp, TrendingDown, AlertTriangle, Clock } from 'lucide-react';
import { FinancialMetricsCard } from './FinancialMetricsCard';
import { FinancialChart } from './FinancialChart';
import { useUnifiedFinancialEntries } from '@/hooks/useUnifiedFinancialEntries';
import { format, startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth, isAfter, isBefore, isToday, isThisWeek, isThisMonth } from 'date-fns';
import { ptBR } from 'date-fns/locale';

type FilterPeriod = 'today' | 'week' | 'month' | 'custom';

interface DateRange {
  from: Date | undefined;
  to: Date | undefined;
}

export const FinanceDashboard = () => {
  const [filterPeriod, setFilterPeriod] = useState<FilterPeriod>('month');
  const [customDateRange, setCustomDateRange] = useState<DateRange>({
    from: undefined,
    to: undefined
  });

  const { entries, loading } = useUnifiedFinancialEntries();

  // Função para filtrar dados por período
  const getFilteredData = useMemo(() => {
    if (!entries || entries.length === 0) return [];

    const today = new Date();
    
    return entries.filter(entry => {
      const entryDate = new Date(entry.due_date);
      
      switch (filterPeriod) {
        case 'today':
          return isToday(entryDate);
        case 'week':
          return isThisWeek(entryDate, { locale: ptBR });
        case 'month':
          return isThisMonth(entryDate);
        case 'custom':
          if (!customDateRange.from || !customDateRange.to) return true;
          return isAfter(entryDate, startOfDay(customDateRange.from)) && 
                 isBefore(entryDate, endOfDay(customDateRange.to));
        default:
          return true;
      }
    });
  }, [entries, filterPeriod, customDateRange]);

  // Cálculos das métricas
  const metrics = useMemo(() => {
    const filteredData = getFilteredData;
    const today = new Date();

    const contasAPagar = filteredData.filter(entry => entry.type === 'payable' && entry.payment_status === 'pending');
    const contasAReceber = filteredData.filter(entry => entry.type === 'receivable' && entry.payment_status === 'pending');
    
    const contasEmAtraso = filteredData.filter(entry => 
      entry.payment_status === 'pending' && 
      entry.type === 'payable' && 
      isAfter(today, new Date(entry.due_date))
    );
    
    const recebimentosEmAtraso = filteredData.filter(entry => 
      entry.payment_status === 'pending' && 
      entry.type === 'receivable' && 
      isAfter(today, new Date(entry.due_date))
    );

    return {
      contasAPagar: {
        count: contasAPagar.length,
        value: contasAPagar.reduce((sum, entry) => sum + Number(entry.amount), 0)
      },
      contasAReceber: {
        count: contasAReceber.length,
        value: contasAReceber.reduce((sum, entry) => sum + Number(entry.amount), 0)
      },
      contasEmAtraso: {
        count: contasEmAtraso.length,
        value: contasEmAtraso.reduce((sum, entry) => sum + Number(entry.amount), 0)
      },
      recebimentosEmAtraso: {
        count: recebimentosEmAtraso.length,
        value: recebimentosEmAtraso.reduce((sum, entry) => sum + Number(entry.amount), 0)
      },
      totalEntradas: filteredData.filter(e => e.type === 'receivable').reduce((sum, entry) => sum + Number(entry.amount), 0),
      totalSaidas: filteredData.filter(e => e.type === 'payable').reduce((sum, entry) => sum + Number(entry.amount), 0)
    };
  }, [getFilteredData]);

  const formatPeriodLabel = () => {
    switch (filterPeriod) {
      case 'today': return 'Hoje';
      case 'week': return 'Esta Semana';
      case 'month': return 'Este Mês';
      case 'custom': 
        if (customDateRange.from && customDateRange.to) {
          return `${format(customDateRange.from, 'dd/MM/yyyy')} - ${format(customDateRange.to, 'dd/MM/yyyy')}`;
        }
        return 'Período Personalizado';
      default: return '';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Carregando dashboard financeiro...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filtros */}
      <Card className="p-4">
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <div className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-primary" />
            <h3 className="text-lg font-semibold">Dashboard Financeiro</h3>
            <span className="text-sm text-muted-foreground">({formatPeriodLabel()})</span>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-2">
            <Select value={filterPeriod} onValueChange={(value: FilterPeriod) => setFilterPeriod(value)}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Selecionar período" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="today">Hoje</SelectItem>
                <SelectItem value="week">Esta Semana</SelectItem>
                <SelectItem value="month">Este Mês</SelectItem>
                <SelectItem value="custom">Personalizado</SelectItem>
              </SelectContent>
            </Select>

            {filterPeriod === 'custom' && (
              <div className="flex gap-2">
                <DatePicker
                  date={customDateRange.from}
                  onDateChange={(date) => setCustomDateRange(prev => ({ ...prev, from: date }))}
                  placeholder="Data inicial"
                />
                <DatePicker
                  date={customDateRange.to}
                  onDateChange={(date) => setCustomDateRange(prev => ({ ...prev, to: date }))}
                  placeholder="Data final"
                />
              </div>
            )}
          </div>
        </div>
      </Card>

      {/* Cards de Métricas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <FinancialMetricsCard
          title="Contas a Pagar"
          count={metrics.contasAPagar.count}
          value={metrics.contasAPagar.value}
          icon={TrendingDown}
          iconColor="text-red-500"
          bgColor="bg-red-50"
        />
        
        <FinancialMetricsCard
          title="Contas a Receber"
          count={metrics.contasAReceber.count}
          value={metrics.contasAReceber.value}
          icon={TrendingUp}
          iconColor="text-green-500"
          bgColor="bg-green-50"
        />
        
        <FinancialMetricsCard
          title="Contas em Atraso"
          count={metrics.contasEmAtraso.count}
          value={metrics.contasEmAtraso.value}
          icon={AlertTriangle}
          iconColor="text-red-600"
          bgColor="bg-red-100"
        />
        
        <FinancialMetricsCard
          title="Recebimentos em Atraso"
          count={metrics.recebimentosEmAtraso.count}
          value={metrics.recebimentosEmAtraso.value}
          icon={Clock}
          iconColor="text-orange-500"
          bgColor="bg-orange-50"
        />
      </div>

      {/* Gráfico de Entrada vs Saída */}
      <FinancialChart 
        data={getFilteredData}
        period={filterPeriod}
        totalEntradas={metrics.totalEntradas}
        totalSaidas={metrics.totalSaidas}
      />
    </div>
  );
};