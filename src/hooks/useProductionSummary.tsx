
import { useMemo } from 'react';
import { Production, ProductionSummary } from '@/types/production';

export const useProductionSummary = (productions: Production[]): ProductionSummary[] => {
  return useMemo(() => {
    const summary: { [key: string]: ProductionSummary } = {};
    
    productions
      .filter(prod => ['pending', 'in_progress'].includes(prod.status))
      .forEach(prod => {
        const key = prod.product_id;
        if (!summary[key]) {
          summary[key] = {
            product_id: prod.product_id,
            product_name: prod.product_name,
            total_quantity: 0,
            orders_count: 0,
            production_items: []
          };
        }
        summary[key].total_quantity += prod.quantity_requested;
        summary[key].orders_count += 1;
        summary[key].production_items.push({
          production_number: prod.production_number,
          quantity: prod.quantity_requested,
          status: prod.status,
          order_number: prod.order_number || '',
          client_name: prod.client_name || ''
        });
      });

    return Object.values(summary);
  }, [productions]);
};
