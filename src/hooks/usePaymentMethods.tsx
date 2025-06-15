
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
  return useFinanceSettingCrud<PaymentMethod>("payment_methods");
}
