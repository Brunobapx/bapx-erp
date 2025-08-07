
// REFATORADO: Agora usa useProductionUnified para reduzir duplicação
import { useProductionUnified } from './useProductionUnified';
import type { Production, ProductionStatus } from '@/types/production';

export const useProduction = () => {
  // Usar o hook unificado com configurações específicas para compatibilidade
  const productionHook = useProductionUnified({
    autoRefresh: true,
    sorting: { field: 'created_at', direction: 'desc' }
  });

  // Manter interface original para compatibilidade
  return {
    productions: productionHook.productions,
    loading: productionHook.loading,
    error: productionHook.error,
    updateProductionStatus: productionHook.updateProductionStatus,
    refreshProductions: productionHook.refreshProductions,
    
    // Novos métodos também disponíveis
    ...productionHook
  };
};

