
import { useMemo } from 'react';
import { Packaging } from '@/hooks/usePackaging';

export type PackagingSummary = {
  product_id: string;
  product_name: string;
  total_quantity: number;
  orders_count: number;
  packaging_items: {
    packaging_number: string;
    quantity: number;
    status: string;
    order_number: string;
    client_name: string;
  }[];
};

export const usePackagingSummary = (packagings: Packaging[]): PackagingSummary[] => {
  return useMemo(() => {
    const summary: { [key: string]: PackagingSummary } = {};
    
    packagings
      .filter(pack => ['pending', 'in_progress'].includes(pack.status))
      .forEach(pack => {
        const key = pack.product_id;
        if (!summary[key]) {
          summary[key] = {
            product_id: pack.product_id,
            product_name: pack.product_name,
            total_quantity: 0,
            orders_count: 0,
            packaging_items: []
          };
        }
        summary[key].total_quantity += pack.quantity_to_package;
        summary[key].orders_count += 1;
        summary[key].packaging_items.push({
          packaging_number: pack.packaging_number,
          quantity: pack.quantity_to_package,
          status: pack.status,
          order_number: pack.order_number || '',
          client_name: pack.client_name || ''
        });
      });

    return Object.values(summary);
  }, [packagings]);
};
