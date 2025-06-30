
import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useActiveFinancialAccounts } from "@/hooks/useActiveFinancialAccounts";

interface PayableBankAccountSelectProps {
  value: string;
  onValueChange: (value: string) => void;
  required?: boolean;
}

const PayableBankAccountSelect = ({ value, onValueChange, required = true }: PayableBankAccountSelectProps) => {
  const { accounts, loading } = useActiveFinancialAccounts();

  // Remover duplicatas baseado no nome da conta
  const uniqueAccounts = accounts.filter((account, index, self) => 
    index === self.findIndex(a => a.name === account.name)
  );

  return (
    <div>
      <Label htmlFor="account">Conta Bancária/Caixa {required && '*'}</Label>
      <Select value={value} onValueChange={onValueChange} disabled={loading}>
        <SelectTrigger>
          <SelectValue placeholder={loading ? "Carregando contas..." : "Selecione a conta"} />
        </SelectTrigger>
        <SelectContent>
          {uniqueAccounts.map(account => (
            <SelectItem key={account.id} value={account.name}>
              {account.name} ({account.account_type})
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};

export default PayableBankAccountSelect;
