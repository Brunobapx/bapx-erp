
import { useFinancialAccounts } from "./useFinancialAccounts";

/**
 * Hook para buscar apenas contas bancárias/caixa ativas
 */
export function useActiveFinancialAccounts() {
  const { items, ...rest } = useFinancialAccounts();
  const activeAccounts = items.filter(acc => acc.is_active);
  return { accounts: activeAccounts, ...rest };
}
