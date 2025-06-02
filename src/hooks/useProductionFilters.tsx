
import { useMemo } from 'react';
import { Production } from '@/types/production';

export const useProductionFilters = (
  productions: Production[],
  searchQuery: string,
  statusFilter: string
) => {
  return useMemo(() => {
    return productions.filter(item => {
      // Text search filter
      const searchString = searchQuery.toLowerCase();
      const matchesSearch = 
        item.production_number?.toLowerCase().includes(searchString) ||
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
  }, [productions, searchQuery, statusFilter]);
};
