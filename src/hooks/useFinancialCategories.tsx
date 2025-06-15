
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
  const { items, loading, error, upsertItem, deleteItem, fetchItems } = useFinanceSettingCrud<FinancialCategory>("financial_categories");
  return { items, loading, error, upsertItem, deleteItem, fetchItems };
}
