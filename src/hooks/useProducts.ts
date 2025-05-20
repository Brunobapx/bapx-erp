
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

export const useProducts = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('Todas');
  const [sortOrder, setSortOrder] = useState('Nome (A-Z)');

  // Fetch products from Supabase
  const { 
    data: products = [], 
    isLoading, 
    error,
    refetch 
  } = useQuery({
    queryKey: ['products'],
    queryFn: async () => {
      try {
        const { data, error } = await supabase
          .from('products')
          .select('*');
          
        if (error) throw error;
        return data || [];
      } catch (error: any) {
        console.error("Error fetching products:", error);
        toast({
          title: "Erro ao carregar produtos",
          description: "Não foi possível carregar a lista de produtos.",
          variant: "destructive"
        });
        return [];
      }
    }
  });

  // Apply filters and sorting to products
  const filteredProducts = products
    .filter(product => {
      // Apply search filter
      const searchString = searchQuery.toLowerCase();
      const matchesSearch = !searchQuery || 
        (product.name && product.name.toLowerCase().includes(searchString)) ||
        (product.code && product.code.toLowerCase().includes(searchString)) ||
        (product.sku && product.sku.toLowerCase().includes(searchString)) ||
        (product.ncm && product.ncm.toLowerCase().includes(searchString)) ||
        (product.category && product.category.toLowerCase().includes(searchString));
      
      // Apply category filter
      const matchesCategory = categoryFilter === 'Todas' || product.category === categoryFilter;
      
      return matchesSearch && matchesCategory;
    })
    .sort((a, b) => {
      // Apply sorting
      switch (sortOrder) {
        case 'Nome (A-Z)':
          return (a.name || '').localeCompare(b.name || '');
        case 'Nome (Z-A)':
          return (b.name || '').localeCompare(a.name || '');
        case 'Preço (Maior)':
          return (b.price || 0) - (a.price || 0);
        case 'Preço (Menor)':
          return (a.price || 0) - (b.price || 0);
        case 'Estoque (Maior)':
          return (b.stock || 0) - (a.stock || 0);
        case 'Estoque (Menor)':
          return (a.stock || 0) - (b.stock || 0);
        default:
          return 0;
      }
    });

  // Get unique categories for filter dropdown
  const categories = ['Todas', ...new Set(products.map(p => p.category).filter(Boolean))];

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  return {
    products,
    filteredProducts,
    isLoading,
    error,
    refetch,
    searchQuery,
    setSearchQuery,
    categoryFilter,
    setCategoryFilter,
    sortOrder,
    setSortOrder,
    categories,
    formatCurrency
  };
};
