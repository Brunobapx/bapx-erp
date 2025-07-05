import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Plus, AlertTriangle, Clock, Trash, Pencil, ChevronDown } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import NewPayableModal from './NewPayableModal';
import { EditPayableModal } from './EditPayableModal';
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { DateRangeFilter } from "./DateRangeFilter";
import { AccountsPayableCards } from "./AccountsPayableCards";
import { AccountsPayableTable } from "./AccountsPayableTable";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { useActiveFinancialAccounts } from "@/hooks/useActiveFinancialAccounts";
import { useFinancialCategories } from "@/hooks/useFinancialCategories";
import { useAuth } from '@/components/Auth/AuthProvider';

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
  account?: string;
}

export const AccountsPayableTab = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [showNewPayableModal, setShowNewPayableModal] = useState(false);
  const [accountsPayable, setAccountsPayable] = useState<AccountPayable[]>([]);
  const [loading, setLoading] = useState(true);
  const [editAccount, setEditAccount] = useState<AccountPayable | null>(null);
  const [period, setPeriod] = useState<{ startDate: Date | null, endDate: Date | null }>({
    startDate: null, endDate: null
  });

  // Novos filtros
  const [accountFilter, setAccountFilter] = useState<string>('');
  const [categoryFilter, setCategoryFilter] = useState<string>('');
  const { accounts: bankAccounts, loading: accountsLoading } = useActiveFinancialAccounts();
  const { items: categories, loading: categoriesLoading } = useFinancialCategories();
  const { user } = useAuth();

  useEffect(() => {
    loadAccountsPayable();
  }, [user]);

  const loadAccountsPayable = async () => {
    try {
      if (!user) return;

      const { data, error } = await supabase
        .from('accounts_payable')
        .select('*')
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
    setEditAccount(account);
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

  // FILTRO
  const filteredAccounts = useMemo(() => {
    let accts = [...accountsPayable];
    if (period.startDate && period.endDate) {
      accts = accts.filter(account => {
        const due = new Date(String(account.due_date));
        return due >= period.startDate! && due <= period.endDate!;
      });
    }
    if (accountFilter) {
      accts = accts.filter(account => account.account === accountFilter);
    }
    if (categoryFilter) {
      accts = accts.filter(account => account.category === categoryFilter);
    }
    return accts.filter(account =>
      account.supplier_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      account.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      account.invoice_number?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [accountsPayable, searchQuery, period, accountFilter, categoryFilter]);

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

  // NOVOS FILTROS VISUAIS (linha com período, conta, categoria)
  const FiltersRow = () => (
    <div className="flex flex-col md:flex-row justify-between items-center gap-2">
      <div className="relative w-full max-w-sm">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar contas..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-8"
        />
      </div>
      <div className="flex gap-2 flex-wrap items-center">
        <DateRangeFilter range={period} onChange={setPeriod} label="Filtrar por período" />
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
                ?.filter(cat => cat.type === "despesa" && cat.is_active)
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
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold">Contas a Pagar</h2>
        <Button onClick={() => setShowNewPayableModal(true)}>
          <Plus className="mr-2 h-4 w-4" /> Nova Conta
        </Button>
      </div>

      <AccountsPayableCards
        totalVencido={totalVencido}
        totalPendente={totalPendente}
        totalPago={totalPago}
      />

      <FiltersRow />

      <Card>
        <CardContent className="p-0">
          <AccountsPayableTable
            accounts={filteredAccounts}
            onPay={handlePayAccount}
            onEdit={handleEditAccount}
            onDelete={handleDeleteAccount}
          />
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
      {editAccount && (
        <EditPayableModal
          open={!!editAccount}
          onClose={() => setEditAccount(null)}
          account={editAccount}
          onSaved={loadAccountsPayable}
        />
      )}
    </div>
  );
};
