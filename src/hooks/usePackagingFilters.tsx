
import { useMemo } from 'react';
import { Packaging } from '@/hooks/usePackaging';

export const usePackagingFilters = (
  packagings: Packaging[],
  searchQuery: string,
  statusFilter: string
) => {
  return useMemo(() => {
    return packagings.filter(item => {
      // Text search filter
      const searchString = searchQuery.toLowerCase();
      const matchesSearch = 
        item.packaging_number?.toLowerCase().includes(searchString) ||
        item.product_name?.toLowerCase().includes(searchString) ||
        item.status?.toLowerCase().includes(searchString);
      
      // Status filter
      const isCompleted = ['completed', 'approved'].includes(item.status);
      if (statusFilter === 'active' && isCompleted) {
        return false;
      }
      if (statusFilter === 'completed' && !isCompleted) {
        return false;
      }

      return matchesSearch;
    });
  }, [packagings, searchQuery, statusFilter]);
};
