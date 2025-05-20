
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Search, ChevronDown, PlusCircle, FileText } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import TransactionModal from './TransactionModal';

const TransactionList = () => {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<any>(null);
  const [filterType, setFilterType] = useState<string | null>(null);
  
  const { data: transactions, isLoading, refetch } = useQuery({
    queryKey: ['transactions', filterType],
    queryFn: async () => {
      try {
        let query = supabase
          .from('finance_transactions')
          .select('*')
          .order('transaction_date', { ascending: false });
          
        if (filterType) {
          query = query.eq('transaction_type', filterType);
        }
        
        const { data, error } = await query;
        
        if (error) throw error;
        return data;
      } catch (error: any) {
        toast({
          title: "Erro ao carregar transações",
          description: error.message,
          variant: "destructive",
        });
        return [];
      }
    }
  });
  
  const handleAddTransaction = () => {
    setSelectedTransaction(null);
    setShowModal(true);
  };
  
  const handleEditTransaction = (transaction: any) => {
    setSelectedTransaction(transaction);
    setShowModal(true);
  };
  
  const handleCloseModal = (shouldRefetch: boolean = false) => {
    setShowModal(false);
    if (shouldRefetch) {
      refetch();
    }
  };
  
  // Filter transactions based on search query
  const filteredTransactions = transactions?.filter(transaction => {
    const query = searchQuery.toLowerCase();
    return (
      transaction.description.toLowerCase().includes(query) ||
      transaction.category?.toLowerCase().includes(query) ||
      transaction.account?.toLowerCase().includes(query) ||
      transaction.payment_status?.toLowerCase().includes(query)
    );
  }) || [];
  
  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Transações</CardTitle>
          <Button onClick={handleAddTransaction}>
            <PlusCircle className="mr-2 h-4 w-4" />
            Nova Transação
          </Button>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4 sm:items-center justify-between mb-4">
            <div className="relative w-full sm:max-w-xs">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar transações..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8"
              />
            </div>
            
            <div className="flex items-center gap-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm">
                    {filterType ? (
                      filterType === 'income' ? 'Receitas' : 
                      filterType === 'expense' ? 'Despesas' : 
                      filterType === 'transfer' ? 'Transferências' : 'Tipo'
                    ) : 'Todos os tipos'} 
                    <ChevronDown className="ml-2 h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem onClick={() => setFilterType(null)}>Todos</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setFilterType('income')}>Receitas</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setFilterType('expense')}>Despesas</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setFilterType('transfer')}>Transferências</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
          
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data</TableHead>
                <TableHead>Descrição</TableHead>
                <TableHead>Categoria</TableHead>
                <TableHead>Conta/Banco</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead className="text-right">Valor (R$)</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center">Carregando...</TableCell>
                </TableRow>
              ) : filteredTransactions.length > 0 ? (
                filteredTransactions.map((transaction) => (
                  <TableRow 
                    key={transaction.id}
                    className="cursor-pointer hover:bg-accent/5"
                    onClick={() => handleEditTransaction(transaction)}
                  >
                    <TableCell>{new Date(transaction.transaction_date).toLocaleDateString('pt-BR')}</TableCell>
                    <TableCell>{transaction.description}</TableCell>
                    <TableCell>{transaction.category || '-'}</TableCell>
                    <TableCell>{transaction.account || '-'}</TableCell>
                    <TableCell>
                      <span className={`stage-badge ${
                        transaction.transaction_type === 'income' ? 'badge-sales' : 
                        transaction.transaction_type === 'expense' ? 'badge-route' : 
                        'badge-packaging'
                      }`}>
                        {transaction.transaction_type === 'income' ? 'Receita' : 
                         transaction.transaction_type === 'expense' ? 'Despesa' : 
                         'Transferência'}
                      </span>
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {Number(transaction.amount).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </TableCell>
                    <TableCell>
                      <span className="stage-badge badge-finance">
                        {transaction.payment_status || 'Concluído'}
                      </span>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground">
                    Nenhuma transação encontrada.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
          
          <div className="mt-4 flex justify-center">
            <Button variant="outline">
              <FileText className="mr-2 h-4 w-4" />
              Exportar Relatório
            </Button>
          </div>
        </CardContent>
      </Card>
      
      {showModal && (
        <TransactionModal
          isOpen={showModal}
          onClose={handleCloseModal}
          transaction={selectedTransaction}
        />
      )}
    </>
  );
};

export default TransactionList;
