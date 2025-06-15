
import { useState } from 'react';
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";

export type Product = {
  id: string;
  code?: string;
  name: string;
  description?: string;
  sku?: string;
  ncm?: string;
  unit?: string;
  category?: string;
  price?: number;
  cost?: number;
  stock?: number;
  is_manufactured?: boolean;
  is_direct_sale?: boolean;
  tax_type?: string;
  icms?: string;
  ipi?: string;
  pis?: string;
  cofins?: string;
  created_at?: string;
  updated_at?: string;
  user_id?: string;
};

async function fetchProducts() {
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) {
    throw new Error('Usuário não autenticado');
  }

  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('user_id', user.id)
    .order('name', { ascending: true });

  if (error) {
    throw error;
  }

  return Array.isArray(data) ? data as Product[] : [];
}

export const useProducts = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const queryClient = useQueryClient();

  const {
    data: allProducts = [],
    isLoading: loading,
    error,
    refetch,
  } = useQuery<Product[], Error>({
    queryKey: ['products'],
    queryFn: fetchProducts,
    staleTime: 1000 * 60 * 10,
    meta: {
      onError: (err: Error) => {
        if (!err.message.includes('não autenticado')) {
          toast.error('Erro ao carregar produtos: ' + (err.message || 'Erro desconhecido'));
        }
      },
    },
  });

  const refreshProducts = () => {
    queryClient.invalidateQueries({ queryKey: ['products'] });
  };

  // Busca/filtragem em memória (memoizada)
  const searchProducts = (searchTerm: string) => {
    if (!searchTerm || searchTerm.trim() === '') return allProducts;
    const searchString = searchTerm.toLowerCase();
    return allProducts.filter(product => {
      return (
        (product.name && product.name.toLowerCase().includes(searchString)) ||
        (product.code && product.code.toLowerCase().includes(searchString)) ||
        (product.sku && product.sku.toLowerCase().includes(searchString)) ||
        (product.ncm && product.ncm.toLowerCase().includes(searchString)) ||
        (product.category && product.category.toLowerCase().includes(searchString))
      );
    });
  };

  const filteredProducts = searchProducts(searchQuery);

  return {
    products: Array.isArray(filteredProducts) ? filteredProducts : [],
    loading,
    error: error ? error.message : null,
    searchQuery,
    setSearchQuery,
    refreshProducts,
    searchProducts,
    refetch
  };
};
