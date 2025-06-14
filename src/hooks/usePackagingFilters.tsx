
import { useMemo } from 'react';
import { Packaging } from '@/hooks/usePackaging';

export const usePackagingFilters = (
  packagings: Packaging[],
  searchQuery: string,
  statusFilter: string,
  orderSort: string
) => {
  return useMemo(() => {
    let filtered = packagings.filter(item => {
      const searchString = searchQuery.toLowerCase();
      const matchesSearch = 
        item.packaging_number?.toLowerCase().includes(searchString) ||
        item.product_name?.toLowerCase().includes(searchString) ||
        item.status?.toLowerCase().includes(searchString);
      const isCompleted = ['completed', 'approved'].includes(item.status);
      if (statusFilter === 'active' && isCompleted) return false;
      if (statusFilter === 'completed' && !isCompleted) return false;
      return matchesSearch;
    });

    // Ordenação
    if (orderSort === 'recent') {
      filtered = [...filtered].sort((a, b) => new Date(b.created_at || '').getTime() - new Date(a.created_at || '').getTime());
    } else if (orderSort === 'oldest') {
      filtered = [...filtered].sort((a, b) => new Date(a.created_at || '').getTime() - new Date(b.created_at || '').getTime());
    } else if (orderSort === 'product_az') {
      filtered = [...filtered].sort((a, b) => (a.product_name || '').localeCompare(b.product_name || ''));
    }
    return filtered;
  }, [packagings, searchQuery, statusFilter, orderSort]);
};
