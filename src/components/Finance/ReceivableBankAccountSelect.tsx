
import React from "react";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useActiveFinancialAccounts } from "@/hooks/useActiveFinancialAccounts";

type ReceivableBankAccountSelectProps = {
  value: string;
  onValueChange: (val: string) => void;
};

const ReceivableBankAccountSelect: React.FC<ReceivableBankAccountSelectProps> = ({ value, onValueChange }) => {
  const { accounts, loading } = useActiveFinancialAccounts();

  return (
    <div>
      <Label htmlFor="account">Conta Bancária *</Label>
      <Select
        value={value}
        onValueChange={(val) => {
          // não permitir seleção do valor de "no-accounts"
          if (val === "no-accounts") return;
          onValueChange(val);
        }}
        disabled={loading || (accounts && accounts.length === 0)}
      >
        <SelectTrigger id="account">
          <SelectValue placeholder={loading ? "Carregando contas..." : "Selecione a conta bancária"} />
        </SelectTrigger>
        <SelectContent>
          {accounts?.length === 0 ? (
            <SelectItem value="no-accounts" disabled>
              Nenhuma conta ativa encontrada
            </SelectItem>
          ) : (
            accounts && accounts.map(acc => (
              <SelectItem key={acc.id} value={acc.name}>
                {acc.name}
              </SelectItem>
            ))
          )}
        </SelectContent>
      </Select>
    </div>
  );
};

export default ReceivableBankAccountSelect;
