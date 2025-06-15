
import { useFinanceSettingCrud } from "./useFinanceSettingCrud";
export interface PaymentMethod {
  id?: string;
  company_id: string;
  name: string;
  description?: string;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}
export function usePaymentMethods() {
  const { items, loading, error, upsertItem, deleteItem, fetchItems } = useFinanceSettingCrud<PaymentMethod>("payment_methods");
  return { items, loading, error, upsertItem, deleteItem, fetchItems };
}
