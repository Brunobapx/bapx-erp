
import { useFinanceSettingCrud } from "./useFinanceSettingCrud";
export interface FinancialCategory {
  id?: string;
  company_id: string;
  name: string;
  type: "receita" | "despesa";
  description?: string;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}
export function useFinancialCategories() {
  return useFinanceSettingCrud<FinancialCategory>("financial_categories");
}
