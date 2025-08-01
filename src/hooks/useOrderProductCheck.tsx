import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Order } from '@/hooks/useOrders';

interface ProductInfo {
  id: string;
  is_direct_sale: boolean;
}

export const useOrderProductCheck = (orders: Order[]) => {
  const [productCache, setProductCache] = useState<Record<string, ProductInfo>>({});
  
  useEffect(() => {
    const loadProductInfo = async () => {
      // Coletar todos os product_ids únicos dos pedidos
      const productIds = new Set<string>();
      orders.forEach(order => {
        order.order_items?.forEach(item => {
          productIds.add(item.product_id);
        });
      });
      
      if (productIds.size === 0) return;
      
      // Buscar informações dos produtos que não estão no cache
      const uncachedIds = Array.from(productIds).filter(id => !productCache[id]);
      
      if (uncachedIds.length === 0) return;
      
      try {
        const { data: products, error } = await supabase
          .from('products')
          .select('id, is_direct_sale')
          .in('id', uncachedIds);
          
        if (error) {
          console.error('Erro ao buscar informações dos produtos:', error);
          return;
        }
        
        if (products) {
          const newCache = { ...productCache };
          products.forEach(product => {
            newCache[product.id] = {
              id: product.id,
              is_direct_sale: product.is_direct_sale
            };
          });
          setProductCache(newCache);
        }
      } catch (error) {
        console.error('Erro ao buscar informações dos produtos:', error);
      }
    };
    
    loadProductInfo();
  }, [orders, productCache]);
  
  const hasDirectSaleProduct = (order: Order): boolean => {
    if (!order.order_items || order.order_items.length === 0) return false;
    
    return order.order_items.some(item => {
      const productInfo = productCache[item.product_id];
      return productInfo?.is_direct_sale === true;
    });
  };
  
  return { hasDirectSaleProduct };
};