
import { useFinanceSettingCrud } from "./useFinanceSettingCrud";
export interface FinancialAccount {
  id?: string;
  company_id: string;
  name: string;
  account_type: 'corrente' | 'poupanca' | 'caixa';
  bank?: string;
  agency?: string;
  account_number?: string;
  initial_balance: number;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}
export function useFinancialAccounts() {
  return useFinanceSettingCrud<FinancialAccount>("financial_accounts");
}
