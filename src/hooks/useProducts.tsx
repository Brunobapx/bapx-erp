
import { useState, useEffect } from 'react';
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

export type Product = {
  id: string;
  code: string;
  name: string;
  sku?: string;
  ncm?: string;
  price?: number;
  cost?: number;
  stock?: number;
  unit?: string;
  category?: string;
  description?: string;
  tax_type?: string;
  icms?: string;
  ipi?: string;
  pis?: string;
  cofins?: string;
  is_manufactured?: boolean;
  created_at?: string;
  updated_at?: string;
  user_id?: string;
};

export const useProducts = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Fetch products from Supabase
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        setError(null);

        const { data, error } = await supabase
          .from('products')
          .select('*');

        if (error) {
          throw error;
        }

        if (data) {
          console.log("Products loaded:", data.length);
          setProducts(data);
        } else {
          // Ensure products is always an array even if data is null
          setProducts([]);
          console.log("No products data returned, using empty array");
        }
      } catch (err: any) {
        console.error('Error fetching products:', err);
        setError(err.message || 'Erro ao carregar produtos');
        toast.error('Erro ao carregar produtos');
        // Ensure products is always an array even on error
        setProducts([]);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [refreshTrigger]);

  // Filter products based on search query
  const filteredProducts = (products || []).filter(product => {
    const searchString = searchQuery.toLowerCase();
    return (
      (product.name && product.name.toLowerCase().includes(searchString)) ||
      (product.code && product.code.toLowerCase().includes(searchString)) ||
      (product.sku && product.sku.toLowerCase().includes(searchString)) ||
      (product.ncm && product.ncm.toLowerCase().includes(searchString)) ||
      (product.category && product.category.toLowerCase().includes(searchString))
    );
  });

  // Refresh products list
  const refreshProducts = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  return {
    products: filteredProducts,
    allProducts: products || [],
    loading,
    error,
    searchQuery,
    setSearchQuery,
    refreshProducts
  };
};
