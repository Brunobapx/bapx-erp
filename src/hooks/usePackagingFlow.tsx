// REFATORADO: Agora usa usePackagingUnified para reduzir duplicação
import { usePackagingUnified } from './usePackagingUnified';
import type { 
  PackagingFlowStatus, 
  PackagingFlowItem 
} from '@/types/packaging';

export type { PackagingFlowStatus, PackagingFlowItem };

export const usePackagingFlow = () => {
  // Usar o hook unificado
  const packagingHook = usePackagingUnified({
    autoRefresh: false, // PackagingFlow tinha refresh manual
    sorting: { field: 'created_at', direction: 'desc' }
  });

  return {
    // Interface legacy mantida
    packagings: packagingHook.packagings,
    loading: packagingHook.loading,
    error: packagingHook.error,
    fetchPackagings: packagingHook.loadPackagings,
    updatePackagingStatus: packagingHook.updatePackagingStatus,
    refreshPackagings: packagingHook.refreshPackagings,
    
    // Filtros para as abas (compatibilidade)
    fromStock: packagingHook.fromStock,
    fromProduction: packagingHook.fromProduction,
    inPackaging: packagingHook.inPackaging,
    ready: packagingHook.ready,
    
    // Novos métodos também disponíveis
    ...packagingHook
  };
};