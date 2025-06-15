import React, { useState } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Plus, CheckCircle, Clock, Trash, Pencil } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { NewReceivableModal } from './NewReceivableModal';
import { useAccountsReceivable } from '@/hooks/useAccountsReceivable';
import { toast } from "sonner";

export const AccountsReceivableTab = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [showNewReceivableModal, setShowNewReceivableModal] = useState(false);
  const { accountsReceivable, loading, error, confirmReceivable, refreshReceivables } = useAccountsReceivable();

  const handleEditReceivable = (account: any) => {
    toast.info(`Editar recebível: ${account.description} (ID: ${account.id})`);
    // Aqui pode chamar uma modal de edição futuramente
  };

  const handleDeleteReceivable = async (account: any) => {
    if (!window.confirm("Tem certeza que deseja excluir este lançamento?")) return;
    try {
      const { error } = await import('@/integrations/supabase/client').then(({ supabase }) =>
        supabase.from('financial_entries').delete().eq('id', account.id)
      );
      if (error) throw error;
      toast.success('Recebível excluído com sucesso!');
      refreshReceivables();
    } catch (error: any) {
      toast.error('Erro ao excluir recebível');
      console.error(error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando contas a receber...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <p className="text-red-600 mb-4">Erro ao carregar contas a receber</p>
          <p className="text-gray-600">{error}</p>
        </div>
      </div>
    );
  }

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
        <Button onClick={() => setShowNewReceivableModal(true)}>
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
                  <TableCell className="font-medium">{account.entry_number}</TableCell>
                  <TableCell>{account.client}</TableCell>
                  <TableCell>{account.description}</TableCell>
                  <TableCell>{account.saleId || '-'}</TableCell>
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
                    <div className="flex gap-1">
                      {account.status !== 'recebido' && (
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => confirmReceivable(account.id)}
                        >
                          Confirmar
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEditReceivable(account)}
                        aria-label="Editar"
                      >
                        <Pencil className="text-muted-foreground" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeleteReceivable(account)}
                        aria-label="Excluir"
                      >
                        <Trash className="text-erp-alert" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {filteredAccounts.length === 0 && (
            <div className="p-4 text-center text-muted-foreground">
              Nenhuma conta a receber encontrada.
            </div>
          )}
        </CardContent>
      </Card>

      <NewReceivableModal
        isOpen={showNewReceivableModal}
        onClose={() => setShowNewReceivableModal(false)}
      />
    </div>
  );
};
