
import { useMemo } from 'react';
import { Production } from '@/types/production';

export const useProductionFilters = (
  productions: Production[],
  searchQuery: string,
  statusFilter: string,
  orderSort: string
) => {
  return useMemo(() => {
    let filtered = productions.filter(item => {
      const searchString = searchQuery.toLowerCase();
      const matchesSearch = 
        item.production_number?.toLowerCase().includes(searchString) ||
        item.product_name?.toLowerCase().includes(searchString) ||
        item.status?.toLowerCase().includes(searchString);
      const isCompleted = ['completed', 'approved'].includes(item.status);
      if (statusFilter === 'active' && isCompleted) return false;
      if (statusFilter === 'completed' && !isCompleted) return false;
      return matchesSearch;
    });

    // Ordenação
    if (orderSort === 'recent') {
      filtered = [...filtered].sort((a, b) => new Date(b.start_date || '').getTime() - new Date(a.start_date || '').getTime());
    } else if (orderSort === 'oldest') {
      filtered = [...filtered].sort((a, b) => new Date(a.start_date || '').getTime() - new Date(b.start_date || '').getTime());
    } else if (orderSort === 'product_az') {
      filtered = [...filtered].sort((a, b) => (a.product_name || '').localeCompare(b.product_name || ''));
    }
    return filtered;
  }, [productions, searchQuery, statusFilter, orderSort]);
};
