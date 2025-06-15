import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CalendarDays, TrendingUp, TrendingDown, DollarSign } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useCashFlow } from '@/hooks/useCashFlow';
import { DateRangeFilter } from "./DateRangeFilter";
import { CashFlowCards } from "./CashFlowCards";
import { CashFlowTable } from "./CashFlowTable";

export const CashFlowTab = () => {
  const [selectedPeriod, setSelectedPeriod] = useState('month');
  const [dateRange, setDateRange] = useState<{ startDate: Date | null, endDate: Date | null }>({
    startDate: null, endDate: null
  });
  const { cashFlowData, loading, error } = useCashFlow();

  const filteredData = useMemo(() => {
    if (dateRange.startDate && dateRange.endDate) {
      return cashFlowData.filter(item => {
        const dt = new Date(item.date);
        return dt >= dateRange.startDate! && dt <= dateRange.endDate!;
      });
    }
    return cashFlowData;
  }, [cashFlowData, dateRange]);

  const totalEntradas = filteredData
    .filter(item => item.type === 'entrada')
    .reduce((sum, item) => sum + item.amount, 0);

  const totalSaidas = filteredData
    .filter(item => item.type === 'saida')
    .reduce((sum, item) => sum + item.amount, 0);

  const saldoFinal = filteredData.length > 0 ? filteredData[filteredData.length - 1].balance : 0;
  const saldoLiquido = totalEntradas - totalSaidas;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando fluxo de caixa...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <p className="text-red-600 mb-4">Erro ao carregar fluxo de caixa</p>
          <p className="text-gray-600">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-center gap-2">
        <h2 className="text-lg font-semibold">Fluxo de Caixa</h2>
        <div className="flex gap-2 flex-wrap items-center">
          <DateRangeFilter range={dateRange} onChange={setDateRange} label="Filtrar por período" />
          <Button 
            variant={selectedPeriod === 'week' ? 'default' : 'outline'} 
            size="sm"
            onClick={() => setSelectedPeriod('week')}
          >
            Semana
          </Button>
          <Button 
            variant={selectedPeriod === 'month' ? 'default' : 'outline'} 
            size="sm"
            onClick={() => setSelectedPeriod('month')}
          >
            Mês
          </Button>
          <Button 
            variant={selectedPeriod === 'year' ? 'default' : 'outline'} 
            size="sm"
            onClick={() => setSelectedPeriod('year')}
          >
            Ano
          </Button>
        </div>
      </div>

      <CashFlowCards
        totalEntradas={totalEntradas}
        totalSaidas={totalSaidas}
        saldoLiquido={saldoLiquido}
        saldoFinal={saldoFinal}
      />

      <Card>
        <CardHeader>
          <CardTitle>Movimentações</CardTitle>
        </CardHeader>
        <CardContent>
          <CashFlowTable data={filteredData} />
          {filteredData.length === 0 && (
            <div className="p-4 text-center text-muted-foreground">
              Nenhuma movimentação encontrada.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
