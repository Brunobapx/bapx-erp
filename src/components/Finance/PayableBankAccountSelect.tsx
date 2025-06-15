
import React from "react";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useActiveFinancialAccounts } from "@/hooks/useActiveFinancialAccounts";

type PayableBankAccountSelectProps = {
  value: string;
  onValueChange: (val: string) => void;
};

const PayableBankAccountSelect: React.FC<PayableBankAccountSelectProps> = ({ value, onValueChange }) => {
  const { accounts, loading } = useActiveFinancialAccounts();

  return (
    <div>
      <Label htmlFor="bank-account">Contas bancárias/Caixa *</Label>
      <Select
        value={value}
        onValueChange={onValueChange}
        disabled={loading}
      >
        <SelectTrigger id="bank-account">
          <SelectValue placeholder={loading ? "Carregando contas..." : "Selecione a conta"} />
        </SelectTrigger>
        <SelectContent>
          {accounts.map(acc => (
            <SelectItem value={acc.name} key={acc.id}>
              {acc.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};

export default PayableBankAccountSelect;
