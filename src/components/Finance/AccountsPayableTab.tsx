import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Plus, AlertTriangle, Clock, Trash, Pencil } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { NewPayableModal } from './NewPayableModal';
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface AccountPayable {
  id: string;
  supplier_name: string;
  description: string;
  amount: number;
  due_date: string;
  status: 'pending' | 'paid' | 'overdue' | 'cancelled';
  category: string;
  invoice_number?: string;
  payment_date?: string;
  payment_method?: string;
  notes?: string;
}

export const AccountsPayableTab = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [showNewPayableModal, setShowNewPayableModal] = useState(false);
  const [accountsPayable, setAccountsPayable] = useState<AccountPayable[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAccountsPayable();
  }, []);

  const loadAccountsPayable = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('accounts_payable')
        .select('*')
        .eq('user_id', user.id)
        .order('due_date', { ascending: true });

      if (error) throw error;
      
      // Atualizar status das contas vencidas
      const today = new Date().toISOString().split('T')[0];
      const updatedData = (data || []).map(account => ({
        ...account,
        status: account.status === 'pending' && account.due_date < today ? 'overdue' : account.status
      }));
      
      setAccountsPayable(updatedData);
    } catch (error: any) {
      console.error('Erro ao carregar contas a pagar:', error);
      toast.error('Erro ao carregar contas a pagar');
    } finally {
      setLoading(false);
    }
  };

  const handlePayAccount = async (accountId: string) => {
    try {
      const { error } = await supabase
        .from('accounts_payable')
        .update({ 
          status: 'paid',
          payment_date: new Date().toISOString().split('T')[0],
          updated_at: new Date().toISOString()
        })
        .eq('id', accountId);

      if (error) throw error;

      toast.success('Conta marcada como paga!');
      loadAccountsPayable();
    } catch (error: any) {
      console.error('Erro ao pagar conta:', error);
      toast.error('Erro ao pagar conta');
    }
  };

  const handleEditAccount = (account: AccountPayable) => {
    toast.info(`Editar lançamento: ${account.description} (ID: ${account.id})`);
    // Aqui pode chamar uma modal de edição futuramente
  };

  const handleDeleteAccount = async (account: AccountPayable) => {
    if (!window.confirm("Tem certeza que deseja excluir este lançamento?")) return;
    try {
      const { error } = await supabase
        .from('accounts_payable')
        .delete()
        .eq('id', account.id);

      if (error) throw error;
      toast.success('Conta excluída com sucesso!');
      loadAccountsPayable();
    } catch (error: any) {
      toast.error('Erro ao excluir conta');
      console.error(error);
    }
  };

  const filteredAccounts = accountsPayable.filter(account =>
    account.supplier_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    account.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
    account.invoice_number?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalVencido = accountsPayable
    .filter(account => account.status === 'overdue')
    .reduce((sum, account) => sum + account.amount, 0);

  const totalPendente = accountsPayable
    .filter(account => account.status === 'pending')
    .reduce((sum, account) => sum + account.amount, 0);

  const totalPago = accountsPayable
    .filter(account => account.status === 'paid')
    .reduce((sum, account) => sum + account.amount, 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando contas a pagar...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold">Contas a Pagar</h2>
        <Button onClick={() => setShowNewPayableModal(true)}>
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

        <Card className="border-l-4 border-l-green-500">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-green-600" />
              <div>
                <p className="text-sm text-muted-foreground">Pagas</p>
                <p className="text-lg font-bold text-green-600">R$ {totalPago.toLocaleString('pt-BR')}</p>
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
                <TableHead>Fornecedor</TableHead>
                <TableHead>Descrição</TableHead>
                <TableHead>NF</TableHead>
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
                  <TableCell className="font-medium">{account.supplier_name}</TableCell>
                  <TableCell>{account.description}</TableCell>
                  <TableCell>{account.invoice_number || '-'}</TableCell>
                  <TableCell>{account.category}</TableCell>
                  <TableCell>{new Date(account.due_date).toLocaleDateString('pt-BR')}</TableCell>
                  <TableCell className="text-right font-medium">
                    R$ {account.amount.toLocaleString('pt-BR')}
                  </TableCell>
                  <TableCell>
                    <span className={`stage-badge ${
                      account.status === 'overdue' ? 'badge-route' : 
                      account.status === 'pending' ? 'badge-packaging' : 
                      account.status === 'paid' ? 'badge-sales' : 'badge-finance'
                    }`}>
                      {account.status === 'overdue' ? 'Vencido' : 
                       account.status === 'pending' ? 'Pendente' : 
                       account.status === 'paid' ? 'Pago' : 'Cancelado'}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      {(account.status === 'pending' || account.status === 'overdue') && (
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handlePayAccount(account.id)}
                        >
                          Pagar
                        </Button>
                      )}
                      <Button 
                        variant="ghost" 
                        size="icon"
                        onClick={() => handleEditAccount(account)}
                        aria-label="Editar"
                      >
                        <Pencil className="text-muted-foreground" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon"
                        onClick={() => handleDeleteAccount(account)}
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
              Nenhuma conta a pagar encontrada.
            </div>
          )}
        </CardContent>
      </Card>

      <NewPayableModal
        isOpen={showNewPayableModal}
        onClose={() => setShowNewPayableModal(false)}
        onSuccess={loadAccountsPayable}
      />
    </div>
  );
};
