
import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface TransactionModalProps {
  isOpen: boolean;
  onClose: (refetch?: boolean) => void;
  transaction?: any;
}

const TransactionModal: React.FC<TransactionModalProps> = ({
  isOpen,
  onClose,
  transaction
}) => {
  const { toast } = useToast();
  const { user } = useAuth();
  const isEditing = !!transaction;
  
  const [formData, setFormData] = useState({
    description: '',
    amount: '',
    transaction_type: 'income',
    category: '',
    account: '',
    transaction_date: '',
    payment_status: 'completed',
    reference_id: '',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  
  useEffect(() => {
    if (transaction) {
      setFormData({
        description: transaction.description || '',
        amount: transaction.amount?.toString() || '',
        transaction_type: transaction.transaction_type || 'income',
        category: transaction.category || '',
        account: transaction.account || '',
        transaction_date: transaction.transaction_date ? new Date(transaction.transaction_date).toISOString().split('T')[0] : '',
        payment_status: transaction.payment_status || 'completed',
        reference_id: transaction.reference_id || '',
      });
    } else {
      // Set default date to today for new transactions
      setFormData({
        ...formData,
        transaction_date: new Date().toISOString().split('T')[0]
      });
    }
  }, [transaction]);
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };
  
  const handleSelectChange = (name: string, value: string) => {
    setFormData({
      ...formData,
      [name]: value,
    });
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast({
        title: "Erro de autenticação",
        description: "Você precisa estar logado para realizar esta operação.",
        variant: "destructive",
      });
      return;
    }
    
    if (!formData.description || !formData.amount || !formData.transaction_date) {
      toast({
        title: "Campos obrigatórios",
        description: "Por favor, preencha todos os campos obrigatórios.",
        variant: "destructive",
      });
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const transactionData = {
        ...formData,
        amount: parseFloat(formData.amount),
        user_id: user.email
      };
      
      let result;
      
      if (isEditing) {
        // Update existing transaction
        result = await supabase
          .from('finance_transactions')
          .update(transactionData)
          .eq('id', transaction.id);
      } else {
        // Create new transaction
        result = await supabase
          .from('finance_transactions')
          .insert([transactionData]);
      }
      
      if (result.error) throw result.error;
      
      toast({
        title: isEditing ? "Transação atualizada" : "Transação criada",
        description: isEditing 
          ? "A transação foi atualizada com sucesso." 
          : "Uma nova transação foi criada com sucesso.",
      });
      
      onClose(true); // Close and trigger refetch
      
    } catch (error: any) {
      console.error("Error saving transaction:", error);
      toast({
        title: "Erro ao salvar",
        description: error.message || "Ocorreu um erro ao salvar a transação.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={() => onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? 'Editar Transação' : 'Nova Transação'}
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="transaction_type">Tipo de Transação*</Label>
              <Select 
                value={formData.transaction_type} 
                onValueChange={(value) => handleSelectChange('transaction_type', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="income">Receita</SelectItem>
                  <SelectItem value="expense">Despesa</SelectItem>
                  <SelectItem value="transfer">Transferência</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="transaction_date">Data*</Label>
              <Input
                type="date"
                id="transaction_date"
                name="transaction_date"
                value={formData.transaction_date}
                onChange={handleInputChange}
                required
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="description">Descrição*</Label>
            <Input
              id="description"
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              placeholder="Descrição da transação"
              required
            />
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="amount">Valor (R$)*</Label>
              <Input
                type="number"
                id="amount"
                name="amount"
                value={formData.amount}
                onChange={handleInputChange}
                placeholder="0,00"
                step="0.01"
                min="0"
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="category">Categoria</Label>
              <Input
                id="category"
                name="category"
                value={formData.category}
                onChange={handleInputChange}
                placeholder="Categoria"
              />
            </div>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="account">Conta/Banco</Label>
              <Input
                id="account"
                name="account"
                value={formData.account}
                onChange={handleInputChange}
                placeholder="Conta ou banco"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="payment_status">Status de Pagamento</Label>
              <Select 
                value={formData.payment_status} 
                onValueChange={(value) => handleSelectChange('payment_status', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Pendente</SelectItem>
                  <SelectItem value="completed">Concluído</SelectItem>
                  <SelectItem value="canceled">Cancelado</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="reference_id">Referência</Label>
            <Input
              id="reference_id"
              name="reference_id"
              value={formData.reference_id}
              onChange={handleInputChange}
              placeholder="Número de referência, nota fiscal, etc."
            />
          </div>
          
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onClose()}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Salvando...' : isEditing ? 'Atualizar' : 'Salvar'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default TransactionModal;
