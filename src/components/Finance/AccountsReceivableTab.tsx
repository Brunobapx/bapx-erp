
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Plus, CheckCircle, Clock } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export const AccountsReceivableTab = () => {
  const [searchQuery, setSearchQuery] = useState('');

  // Mock data for accounts receivable
  const accountsReceivable = [
    { 
      id: 'CR-001', 
      client: 'Tech Solutions', 
      description: 'Venda Server Hardware', 
      amount: 50000, 
      dueDate: '2025-05-25', 
      status: 'pendente',
      saleId: 'V-001'
    },
    { 
      id: 'CR-002', 
      client: 'City Hospital', 
      description: 'Venda Medical Equipment', 
      amount: 35000, 
      dueDate: '2025-05-27', 
      status: 'recebido',
      saleId: 'V-003'
    },
    { 
      id: 'CR-003', 
      client: 'Global Foods', 
      description: 'Venda Packaging Materials', 
      amount: 9800, 
      dueDate: '2025-05-30', 
      status: 'pendente',
      saleId: 'V-004'
    },
    { 
      id: 'CR-004', 
      client: 'Green Energy Inc', 
      description: 'Venda Solar Panels', 
      amount: 75000, 
      dueDate: '2025-06-15', 
      status: 'vencido',
      saleId: 'V-002'
    },
  ];

  const filteredAccounts = accountsReceivable.filter(account =>
    account.client.toLowerCase().includes(searchQuery.toLowerCase()) ||
    account.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalRecebido = accountsReceivable
    .filter(account => account.status === 'recebido')
    .reduce((sum, account) => sum + account.amount, 0);

  const totalPendente = accountsReceivable
    .filter(account => account.status === 'pendente')
    .reduce((sum, account) => sum + account.amount, 0);

  const totalVencido = accountsReceivable
    .filter(account => account.status === 'vencido')
    .reduce((sum, account) => sum + account.amount, 0);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold">Contas a Receber</h2>
        <Button>
          <Plus className="mr-2 h-4 w-4" /> Nova Cobrança
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-l-4 border-l-green-500">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <div>
                <p className="text-sm text-muted-foreground">Recebidas</p>
                <p className="text-lg font-bold text-green-600">R$ {totalRecebido.toLocaleString('pt-BR')}</p>
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

        <Card className="border-l-4 border-l-red-500">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-red-600" />
              <div>
                <p className="text-sm text-muted-foreground">Vencidas</p>
                <p className="text-lg font-bold text-red-600">R$ {totalVencido.toLocaleString('pt-BR')}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex justify-between items-center">
        <div className="relative w-full max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar recebimentos..."
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
                <TableHead>Cliente</TableHead>
                <TableHead>Descrição</TableHead>
                <TableHead>ID Venda</TableHead>
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
                  <TableCell>{account.client}</TableCell>
                  <TableCell>{account.description}</TableCell>
                  <TableCell>{account.saleId}</TableCell>
                  <TableCell>{new Date(account.dueDate).toLocaleDateString('pt-BR')}</TableCell>
                  <TableCell className="text-right font-medium">
                    R$ {account.amount.toLocaleString('pt-BR')}
                  </TableCell>
                  <TableCell>
                    <span className={`stage-badge ${
                      account.status === 'recebido' ? 'badge-sales' : 
                      account.status === 'pendente' ? 'badge-packaging' : 'badge-route'
                    }`}>
                      {account.status === 'recebido' ? 'Recebido' : 
                       account.status === 'pendente' ? 'Pendente' : 'Vencido'}
                    </span>
                  </TableCell>
                  <TableCell>
                    {account.status !== 'recebido' && (
                      <Button variant="outline" size="sm">
                        Confirmar
                      </Button>
                    )}
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
