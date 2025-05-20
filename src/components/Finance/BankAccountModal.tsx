
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

interface BankAccountModalProps {
  isOpen: boolean;
  onClose: (refetch?: boolean) => void;
  account?: any;
}

const BankAccountModal: React.FC<BankAccountModalProps> = ({
  isOpen,
  onClose,
  account
}) => {
  const { toast } = useToast();
  const { user } = useAuth();
  const isEditing = !!account;
  
  const [formData, setFormData] = useState({
    name: '',
    bank_name: '',
    account_number: '',
    account_type: 'checking',
    current_balance: '',
    is_active: true,
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  
  useEffect(() => {
    if (account) {
      setFormData({
        name: account.name || '',
        bank_name: account.bank_name || '',
        account_number: account.account_number || '',
        account_type: account.account_type || 'checking',
        current_balance: account.current_balance?.toString() || '0',
        is_active: account.is_active !== false,
      });
    }
  }, [account]);
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };
  
  const handleSelectChange = (name: string, value: string | boolean) => {
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
    
    if (!formData.name) {
      toast({
        title: "Nome obrigatório",
        description: "Por favor, informe um nome para a conta bancária.",
        variant: "destructive",
      });
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const accountData = {
        ...formData,
        current_balance: parseFloat(formData.current_balance || '0'),
        user_id: user.email
      };
      
      let result;
      
      if (isEditing) {
        // Update existing account
        result = await supabase
          .from('bank_accounts')
          .update(accountData)
          .eq('id', account.id);
      } else {
        // Create new account
        result = await supabase
          .from('bank_accounts')
          .insert([accountData]);
      }
      
      if (result.error) throw result.error;
      
      toast({
        title: isEditing ? "Conta atualizada" : "Conta criada",
        description: isEditing 
          ? "A conta bancária foi atualizada com sucesso." 
          : "Uma nova conta bancária foi criada com sucesso.",
      });
      
      onClose(true); // Close and trigger refetch
      
    } catch (error: any) {
      console.error("Error saving bank account:", error);
      toast({
        title: "Erro ao salvar",
        description: error.message || "Ocorreu um erro ao salvar a conta bancária.",
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
            {isEditing ? 'Editar Conta Bancária' : 'Nova Conta Bancária'}
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nome da Conta*</Label>
            <Input
              id="name"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              placeholder="Ex: Conta Corrente Principal"
              required
            />
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="bank_name">Nome do Banco</Label>
              <Input
                id="bank_name"
                name="bank_name"
                value={formData.bank_name}
                onChange={handleInputChange}
                placeholder="Ex: Banco do Brasil"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="account_number">Número da Conta</Label>
              <Input
                id="account_number"
                name="account_number"
                value={formData.account_number}
                onChange={handleInputChange}
                placeholder="Ex: 12345-6"
              />
            </div>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="account_type">Tipo de Conta</Label>
              <Select 
                value={formData.account_type} 
                onValueChange={(value) => handleSelectChange('account_type', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="checking">Conta Corrente</SelectItem>
                  <SelectItem value="savings">Poupança</SelectItem>
                  <SelectItem value="investment">Investimento</SelectItem>
                  <SelectItem value="credit">Cartão de Crédito</SelectItem>
                  <SelectItem value="cash">Caixa/Dinheiro</SelectItem>
                  <SelectItem value="other">Outro</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="current_balance">Saldo Atual (R$)</Label>
              <Input
                type="number"
                id="current_balance"
                name="current_balance"
                value={formData.current_balance}
                onChange={handleInputChange}
                placeholder="0,00"
                step="0.01"
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <Label>Status da Conta</Label>
            <Select 
              value={formData.is_active ? "active" : "inactive"} 
              onValueChange={(value) => handleSelectChange('is_active', value === "active")}
            >
              <SelectTrigger>
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Ativa</SelectItem>
                <SelectItem value="inactive">Inativa</SelectItem>
              </SelectContent>
            </Select>
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

export default BankAccountModal;
