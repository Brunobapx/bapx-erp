
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CalendarDays, TrendingUp, TrendingDown, DollarSign } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export const CashFlowTab = () => {
  const [selectedPeriod, setSelectedPeriod] = useState('month');

  // Mock data for cash flow
  const cashFlowData = [
    { date: '01/05/2025', description: 'Venda Tech Solutions', type: 'entrada', amount: 50000, balance: 150000 },
    { date: '02/05/2025', description: 'Pagamento Fornecedor', type: 'saida', amount: 15000, balance: 135000 },
    { date: '03/05/2025', description: 'Recebimento City Hospital', type: 'entrada', amount: 35000, balance: 170000 },
    { date: '04/05/2025', description: 'Salários', type: 'saida', amount: 25000, balance: 145000 },
    { date: '05/05/2025', description: 'Venda Global Foods', type: 'entrada', amount: 9800, balance: 154800 },
  ];

  const totalEntradas = cashFlowData
    .filter(item => item.type === 'entrada')
    .reduce((sum, item) => sum + item.amount, 0);

  const totalSaidas = cashFlowData
    .filter(item => item.type === 'saida')
    .reduce((sum, item) => sum + item.amount, 0);

  const saldoFinal = totalEntradas - totalSaidas;

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
                <p className={`text-lg font-bold ${saldoFinal >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  R$ {saldoFinal.toLocaleString('pt-BR')}
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
                <p className="text-lg font-bold text-purple-600">R$ 154.800</p>
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
              {cashFlowData.map((item, index) => (
                <TableRow key={index}>
                  <TableCell>{item.date}</TableCell>
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
        </CardContent>
      </Card>
    </div>
  );
};
