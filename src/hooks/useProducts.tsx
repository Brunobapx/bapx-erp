
import { useState, useEffect } from 'react';
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

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
  tax_type?: string;
  icms?: string;
  ipi?: string;
  pis?: string;
  cofins?: string;
  created_at?: string;
  updated_at?: string;
  user_id?: string;
};

export const useProducts = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        setError(null);

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

        console.log("Products loaded:", data?.length || 0);
        setProducts(data || []);
      } catch (err: any) {
        console.error('Error fetching products:', err);
        setError(err.message || 'Erro ao carregar produtos');
        toast.error('Erro ao carregar produtos');
        setProducts([]);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [refreshTrigger]);

  const refreshProducts = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  // Função para buscar produtos com termo de pesquisa
  const searchProducts = (searchTerm: string) => {
    if (!searchTerm || searchTerm.trim() === '') {
      return products;
    }
    
    const searchString = searchTerm.toLowerCase();
    return products.filter(product => {
      return (
        (product.name && product.name.toLowerCase().includes(searchString)) ||
        (product.code && product.code.toLowerCase().includes(searchString)) ||
        (product.sku && product.sku.toLowerCase().includes(searchString)) ||
        (product.ncm && product.ncm.toLowerCase().includes(searchString)) ||
        (product.category && product.category.toLowerCase().includes(searchString))
      );
    });
  };

  return {
    products,
    loading,
    error,
    refreshProducts,
    searchProducts
  };
};
