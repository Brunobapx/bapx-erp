// REFATORADO: Agora usa usePackagingUnified para reduzir duplicação
import { usePackagingUnified } from './usePackagingUnified';
import type { Packaging, PackagingStatus } from '@/types/packaging';

export type { PackagingStatus, Packaging };

export const usePackaging = () => {
  // Usar o hook unificado com configurações específicas para compatibilidade
  const packagingHook = usePackagingUnified({
    autoRefresh: true,
    sorting: { field: 'created_at', direction: 'desc' }
  });

  // Manter interface original para compatibilidade
  return {
    packagings: packagingHook.packagings,
    loading: packagingHook.loading,
    error: packagingHook.error,
    updatePackagingStatus: packagingHook.updatePackagingStatus,
    refreshPackagings: packagingHook.refreshPackagings,
    
    // Novos métodos também disponíveis
    ...packagingHook
  };
};