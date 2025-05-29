
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Plus, AlertTriangle, Clock } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export const AccountsPayableTab = () => {
  const [searchQuery, setSearchQuery] = useState('');

  // Mock data for accounts payable
  const accountsPayable = [
    { 
      id: 'CP-001', 
      supplier: 'Fornecedor ABC', 
      description: 'Matéria Prima', 
      amount: 15000, 
      dueDate: '2025-05-20', 
      status: 'vencido',
      category: 'Compras'
    },
    { 
      id: 'CP-002', 
      supplier: 'Transportadora XYZ', 
      description: 'Frete Maio', 
      amount: 3500, 
      dueDate: '2025-05-25', 
      status: 'pendente',
      category: 'Logística'
    },
    { 
      id: 'CP-003', 
      supplier: 'Energia Elétrica', 
      description: 'Conta de Luz', 
      amount: 2800, 
      dueDate: '2025-05-30', 
      status: 'pendente',
      category: 'Utilidades'
    },
    { 
      id: 'CP-004', 
      supplier: 'Banco Central', 
      description: 'Empréstimo Parcela', 
      amount: 8500, 
      dueDate: '2025-06-01', 
      status: 'agendado',
      category: 'Financiamento'
    },
  ];

  const filteredAccounts = accountsPayable.filter(account =>
    account.supplier.toLowerCase().includes(searchQuery.toLowerCase()) ||
    account.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalVencido = accountsPayable
    .filter(account => account.status === 'vencido')
    .reduce((sum, account) => sum + account.amount, 0);

  const totalPendente = accountsPayable
    .filter(account => account.status === 'pendente')
    .reduce((sum, account) => sum + account.amount, 0);

  const totalAgendado = accountsPayable
    .filter(account => account.status === 'agendado')
    .reduce((sum, account) => sum + account.amount, 0);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold">Contas a Pagar</h2>
        <Button>
          <Plus className="mr-2 h-4 w-4" /> Nova Conta
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-l-4 border-l-red-500">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-red-600" />
              <div>
                <p className="text-sm text-muted-foreground">Vencidas</p>
                <p className="text-lg font-bold text-red-600">R$ {totalVencido.toLocaleString('pt-BR')}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-yellow-500">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-yellow-600" />
              <div>
                <p className="text-sm text-muted-foreground">Pendentes</p>
                <p className="text-lg font-bold text-yellow-600">R$ {totalPendente.toLocaleString('pt-BR')}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-blue-500">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-blue-600" />
              <div>
                <p className="text-sm text-muted-foreground">Agendadas</p>
                <p className="text-lg font-bold text-blue-600">R$ {totalAgendado.toLocaleString('pt-BR')}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex justify-between items-center">
        <div className="relative w-full max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar contas..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8"
          />
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Fornecedor</TableHead>
                <TableHead>Descrição</TableHead>
                <TableHead>Categoria</TableHead>
                <TableHead>Vencimento</TableHead>
                <TableHead className="text-right">Valor</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredAccounts.map((account) => (
                <TableRow key={account.id}>
                  <TableCell className="font-medium">{account.id}</TableCell>
                  <TableCell>{account.supplier}</TableCell>
                  <TableCell>{account.description}</TableCell>
                  <TableCell>{account.category}</TableCell>
                  <TableCell>{new Date(account.dueDate).toLocaleDateString('pt-BR')}</TableCell>
                  <TableCell className="text-right font-medium">
                    R$ {account.amount.toLocaleString('pt-BR')}
                  </TableCell>
                  <TableCell>
                    <span className={`stage-badge ${
                      account.status === 'vencido' ? 'badge-route' : 
                      account.status === 'pendente' ? 'badge-packaging' : 'badge-finance'
                    }`}>
                      {account.status === 'vencido' ? 'Vencido' : 
                       account.status === 'pendente' ? 'Pendente' : 'Agendado'}
                    </span>
                  </TableCell>
                  <TableCell>
                    <Button variant="outline" size="sm">
                      Pagar
                    </Button>
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
