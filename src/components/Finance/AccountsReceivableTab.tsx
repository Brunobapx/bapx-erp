import React, { useState, useMemo } from 'react';
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
import { EditReceivableModal } from './EditReceivableModal';
import { DateRangeFilter } from "./DateRangeFilter";
import { useActiveFinancialAccounts } from "@/hooks/useActiveFinancialAccounts";
import { useFinancialCategories } from "@/hooks/useFinancialCategories";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { ChevronDown } from "lucide-react";
import { AccountsReceivableSummaryCards } from "./AccountsReceivableSummaryCards";
import { AccountsReceivableFilters } from "./AccountsReceivableFilters";
import { AccountsReceivableTable } from "./AccountsReceivableTable";

export const AccountsReceivableTab = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [showNewReceivableModal, setShowNewReceivableModal] = useState(false);
  const [editAccount, setEditAccount] = useState<any>(null);
  const [period, setPeriod] = useState<{ startDate: Date | null, endDate: Date | null }>({
    startDate: null, endDate: null
  });
  // filtros novos
  const [accountFilter, setAccountFilter] = useState<string>('');
  const [categoryFilter, setCategoryFilter] = useState<string>('');

  const { accounts, loading: accountsLoading } = useActiveFinancialAccounts();
  const { items: categories, loading: categoriesLoading } = useFinancialCategories();

  const { accountsReceivable, loading, error, confirmReceivable, refreshReceivables } = useAccountsReceivable();

  const handleEditReceivable = (account: any) => {
    setEditAccount(account);
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

  // Mover useMemo ANTES dos returns condicionais!
  // Filtro aplicado por período (conversão str->Date para comparação)
  const filteredAccounts = useMemo(() => {
    let accts = [...accountsReceivable];
    if (period.startDate && period.endDate) {
      accts = accts.filter(account => {
        const due = new Date(String(account.dueDate));
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
      account.client.toLowerCase().includes(searchQuery.toLowerCase()) ||
      account.description.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [accountsReceivable, searchQuery, period, accountFilter, categoryFilter]);

  const totalRecebido = accountsReceivable
    .filter(account => account.status === 'recebido')
    .reduce((sum, account) => sum + account.amount, 0);

  const totalPendente = accountsReceivable
    .filter(account => account.status === 'pendente')
    .reduce((sum, account) => sum + account.amount, 0);

  const totalVencido = accountsReceivable
    .filter(account => account.status === 'vencido')
    .reduce((sum, account) => sum + account.amount, 0);

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

  // AccountSelect Popover Menu
  const AccountSelect = () => (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" className="min-w-[140px] flex justify-between">
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
          {accounts?.map(acc => (
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
  );

  // CategorySelect Popover Menu
  const CategorySelect = () => (
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
            ?.filter(cat => cat.type === "receita" && cat.is_active)
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
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold">Contas a Receber</h2>
        <Button onClick={() => setShowNewReceivableModal(true)}>
          <span className="flex items-center"><Plus className="mr-2 h-4 w-4" /> Nova Cobrança</span>
        </Button>
      </div>

      <AccountsReceivableSummaryCards
        totalRecebido={totalRecebido}
        totalPendente={totalPendente}
        totalVencido={totalVencido}
      />

      <AccountsReceivableFilters
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        period={period}
        setPeriod={setPeriod}
        accountFilter={accountFilter}
        setAccountFilter={setAccountFilter}
        accounts={accounts}
        accountsLoading={accountsLoading}
        categoryFilter={categoryFilter}
        setCategoryFilter={setCategoryFilter}
        categories={categories}
        categoriesLoading={categoriesLoading}
      />

      <Card>
        <CardContent className="p-0">
          <AccountsReceivableTable
            accounts={filteredAccounts}
            confirmReceivable={confirmReceivable}
            onEdit={handleEditReceivable}
            onDelete={handleDeleteReceivable}
          />
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
      {editAccount && (
        <EditReceivableModal
          open={!!editAccount}
          onClose={() => setEditAccount(null)}
          account={editAccount}
          onSaved={refreshReceivables}
        />
      )}
    </div>
  );
};
