
import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CalendarDays, TrendingUp, TrendingDown, DollarSign, ChevronDown } from 'lucide-react';
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
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { useActiveFinancialAccounts } from "@/hooks/useActiveFinancialAccounts";
import { useFinancialCategories } from "@/hooks/useFinancialCategories";

export const CashFlowTab = () => {
  const [selectedPeriod, setSelectedPeriod] = useState('month');
  const [dateRange, setDateRange] = useState<{ startDate: Date | null, endDate: Date | null }>({
    startDate: null, endDate: null
  });

  // Novos filtros
  const [accountFilter, setAccountFilter] = useState<string>('');
  const [categoryFilter, setCategoryFilter] = useState<string>('');
  const { accounts: bankAccounts, loading: accountsLoading } = useActiveFinancialAccounts();
  const { items: categories, loading: categoriesLoading } = useFinancialCategories();

  const { cashFlowData, loading, error } = useCashFlow();

  // Aplicar filtros
  const filteredData = useMemo(() => {
    let items = [...cashFlowData];
    if (dateRange.startDate && dateRange.endDate) {
      items = items.filter(item => {
        const dt = new Date(item.date);
        return dt >= dateRange.startDate! && dt <= dateRange.endDate!;
      });
    }
    if (accountFilter) {
      items = items.filter(item => item.account === accountFilter);
    }
    if (categoryFilter) {
      items = items.filter(item => item.category === categoryFilter);
    }
    return items;
  }, [cashFlowData, dateRange, accountFilter, categoryFilter]);

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

  // NOVOS filtros visuais (linha com período, conta, categoria, e botões semana/mês/ano)
  const FiltersRow = () => (
    <div className="flex flex-wrap md:flex-row gap-2 items-center justify-between">
      <div className="flex gap-2 flex-wrap items-center">
        <DateRangeFilter range={dateRange} onChange={setDateRange} label="Filtrar por período" />
        {/* Conta Bancária Filter */}
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" className="min-w-[135px] flex justify-between">
              <span>{accountFilter ? accountFilter : "Conta bancária/Caixa"}</span>
              <ChevronDown className="ml-2 h-4 w-4 text-muted-foreground" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-44 p-0">
            <ul>
              <li>
                <Button
                  size="sm"
                  variant={!accountFilter ? "secondary" : "ghost"}
                  className="w-full justify-start rounded-none"
                  onClick={() => setAccountFilter("")}
                  disabled={accountsLoading}
                >
                  Todas
                </Button>
              </li>
              {bankAccounts.map(acc => (
                <li key={acc.id}>
                  <Button
                    size="sm"
                    variant={accountFilter === acc.name ? "secondary" : "ghost"}
                    className="w-full justify-start rounded-none"
                    onClick={() => setAccountFilter(acc.name)}
                    disabled={accountsLoading}
                  >
                    {acc.name}
                  </Button>
                </li>
              ))}
            </ul>
          </PopoverContent>
        </Popover>
        {/* Categoria Filter */}
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" className="min-w-[120px] flex justify-between">
              <span>{categoryFilter ? categoryFilter : "Categoria"}</span>
              <ChevronDown className="ml-2 h-4 w-4 text-muted-foreground" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-44 p-0">
            <ul>
              <li>
                <Button
                  size="sm"
                  variant={!categoryFilter ? "secondary" : "ghost"}
                  className="w-full justify-start rounded-none"
                  onClick={() => setCategoryFilter("")}
                  disabled={categoriesLoading}
                >
                  Todas
                </Button>
              </li>
              {categories
                ?.filter(cat => cat.is_active)
                .map(cat => (
                  <li key={cat.id}>
                    <Button
                      size="sm"
                      variant={categoryFilter === cat.name ? "secondary" : "ghost"}
                      className="w-full justify-start rounded-none"
                      onClick={() => setCategoryFilter(cat.name)}
                      disabled={categoriesLoading}
                    >
                      {cat.name}
                    </Button>
                  </li>
                ))}
            </ul>
          </PopoverContent>
        </Popover>
      </div>
      <div className="flex gap-2 items-center flex-wrap mt-2 md:mt-0">
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
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-center gap-2">
        <h2 className="text-lg font-semibold">Fluxo de Caixa</h2>
      </div>

      <CashFlowCards
        totalEntradas={totalEntradas}
        totalSaidas={totalSaidas}
        saldoLiquido={saldoLiquido}
        saldoFinal={saldoFinal}
      />

      <FiltersRow />

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
