
import React, { useState } from 'react';
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

export const CashFlowTab = () => {
  const [selectedPeriod, setSelectedPeriod] = useState('month');
  const { cashFlowData, loading, error } = useCashFlow();

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

  const totalEntradas = cashFlowData
    .filter(item => item.type === 'entrada')
    .reduce((sum, item) => sum + item.amount, 0);

  const totalSaidas = cashFlowData
    .filter(item => item.type === 'saida')
    .reduce((sum, item) => sum + item.amount, 0);

  const saldoFinal = cashFlowData.length > 0 ? cashFlowData[cashFlowData.length - 1].balance : 0;
  const saldoLiquido = totalEntradas - totalSaidas;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold">Fluxo de Caixa</h2>
        <div className="flex gap-2">
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

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-green-600" />
              <div>
                <p className="text-sm text-muted-foreground">Total Entradas</p>
                <p className="text-lg font-bold text-green-600">R$ {totalEntradas.toLocaleString('pt-BR')}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <TrendingDown className="h-4 w-4 text-red-600" />
              <div>
                <p className="text-sm text-muted-foreground">Total Saídas</p>
                <p className="text-lg font-bold text-red-600">R$ {totalSaidas.toLocaleString('pt-BR')}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-blue-600" />
              <div>
                <p className="text-sm text-muted-foreground">Saldo Líquido</p>
                <p className={`text-lg font-bold ${saldoLiquido >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  R$ {saldoLiquido.toLocaleString('pt-BR')}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <CalendarDays className="h-4 w-4 text-purple-600" />
              <div>
                <p className="text-sm text-muted-foreground">Saldo Final</p>
                <p className="text-lg font-bold text-purple-600">R$ {saldoFinal.toLocaleString('pt-BR')}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Movimentações</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data</TableHead>
                <TableHead>Descrição</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead className="text-right">Valor</TableHead>
                <TableHead className="text-right">Saldo</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {cashFlowData.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>{new Date(item.date).toLocaleDateString('pt-BR')}</TableCell>
                  <TableCell>{item.description}</TableCell>
                  <TableCell>
                    <span className={`stage-badge ${item.type === 'entrada' ? 'badge-sales' : 'badge-route'}`}>
                      {item.type === 'entrada' ? 'Entrada' : 'Saída'}
                    </span>
                  </TableCell>
                  <TableCell className={`text-right font-medium ${item.type === 'entrada' ? 'text-green-600' : 'text-red-600'}`}>
                    {item.type === 'entrada' ? '+' : '-'} R$ {item.amount.toLocaleString('pt-BR')}
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    R$ {item.balance.toLocaleString('pt-BR')}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {cashFlowData.length === 0 && (
            <div className="p-4 text-center text-muted-foreground">
              Nenhuma movimentação encontrada.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
