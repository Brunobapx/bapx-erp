
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PlusCircle, Pencil, Trash2 } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import BankAccountModal from './BankAccountModal';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const BankAccountsList = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showModal, setShowModal] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState<any>(null);
  const [accountToDelete, setAccountToDelete] = useState<string | null>(null);
  
  const { data: accounts, isLoading } = useQuery({
    queryKey: ['bankAccounts'],
    queryFn: async () => {
      try {
        const { data, error } = await supabase
          .from('bank_accounts')
          .select('*')
          .order('name');
          
        if (error) throw error;
        return data;
      } catch (error: any) {
        toast({
          title: "Erro ao carregar contas bancárias",
          description: error.message,
          variant: "destructive",
        });
        return [];
      }
    }
  });
  
  const deleteAccountMutation = useMutation({
    mutationFn: async (accountId: string) => {
      const { error } = await supabase
        .from('bank_accounts')
        .delete()
        .eq('id', accountId);
        
      if (error) throw error;
      return accountId;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bankAccounts'] });
      toast({
        title: "Conta excluída",
        description: "A conta bancária foi excluída com sucesso.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao excluir conta",
        description: error.message || "Ocorreu um erro ao excluir a conta bancária.",
        variant: "destructive",
      });
    }
  });
  
  const handleAddAccount = () => {
    setSelectedAccount(null);
    setShowModal(true);
  };
  
  const handleEditAccount = (account: any) => {
    setSelectedAccount(account);
    setShowModal(true);
  };
  
  const handleDeleteAccount = (accountId: string) => {
    setAccountToDelete(accountId);
  };
  
  const confirmDelete = () => {
    if (accountToDelete) {
      deleteAccountMutation.mutate(accountToDelete);
      setAccountToDelete(null);
    }
  };
  
  const handleCloseModal = (shouldRefetch: boolean = false) => {
    setShowModal(false);
    if (shouldRefetch) {
      queryClient.invalidateQueries({ queryKey: ['bankAccounts'] });
    }
  };
  
  // Calculate total balance across all accounts
  const totalBalance = accounts?.reduce((total, account) => total + Number(account.current_balance), 0) || 0;
  
  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Contas Bancárias</CardTitle>
          <Button onClick={handleAddAccount}>
            <PlusCircle className="mr-2 h-4 w-4" />
            Nova Conta
          </Button>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-4">Carregando...</div>
          ) : accounts && accounts.length > 0 ? (
            <div className="space-y-4">
              <div className="grid grid-cols-1 gap-4">
                {accounts.map((account) => (
                  <div key={account.id} className="border rounded-lg p-4">
                    <div className="flex justify-between items-center">
                      <div>
                        <h3 className="font-medium">{account.name}</h3>
                        <p className="text-sm text-muted-foreground">
                          {account.bank_name} {account.account_number ? `• ${account.account_number}` : ''}
                        </p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <p className={`font-medium ${Number(account.current_balance) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          R$ {Number(account.current_balance).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </p>
                        <div className="flex space-x-1">
                          <Button variant="ghost" size="icon" onClick={() => handleEditAccount(account)}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => handleDeleteAccount(account.id)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="border-t pt-4 mt-6">
                <div className="flex justify-between items-center">
                  <p className="font-medium">Saldo Total</p>
                  <p className={`font-bold text-lg ${totalBalance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    R$ {totalBalance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-6 text-muted-foreground">
              <p>Nenhuma conta bancária cadastrada.</p>
              <p className="text-sm mt-1">Adicione sua primeira conta para gerenciar seus recursos.</p>
            </div>
          )}
        </CardContent>
      </Card>
      
      {showModal && (
        <BankAccountModal
          isOpen={showModal}
          onClose={handleCloseModal}
          account={selectedAccount}
        />
      )}
      
      <AlertDialog open={!!accountToDelete} onOpenChange={() => setAccountToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Você tem certeza?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. Isto irá remover permanentemente esta conta bancária
              e todas as informações associadas a ela.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete}>Excluir</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default BankAccountsList;
