// REFATORADO: Agora usa useProductionUnified para reduzir duplicação
import { useProductionUnified } from './useProductionUnified';
import type { 
  ProductionFlowStatus, 
  ProductionFlowItem, 
  InternalProductionItem,
  OrderProductionItem
} from '@/types/production';

export type { ProductionFlowStatus, ProductionFlowItem, InternalProductionItem };

export const useProductionFlow = () => {
  // Usar o hook unificado
  const productionHook = useProductionUnified({
    autoRefresh: false, // ProductionFlow tinha refresh manual
    sorting: { field: 'created_at', direction: 'desc' }
  });

  // Mapear para interface legacy
  const productions = productionHook.getOrderProductions();
  const internalProductions = productionHook.getInternalProductions();

  return {
    // Interface legacy mantida
    productions,
    internalProductions,
    loading: productionHook.loading,
    error: productionHook.error,
    fetchProductions: productionHook.loadProductions,
    updateProductionStatus: productionHook.updateProductionStatus,
    refreshProductions: productionHook.refreshProductions,
    
    // Novos métodos também disponíveis
    ...productionHook
  };
};