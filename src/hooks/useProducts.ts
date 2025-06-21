
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/components/Auth/AuthProvider';

export interface Product {
  id: string;
  code?: string;
  name: string;
  description?: string;
  sku?: string;
  price: number;
  cost: number;
  stock: number;
  ncm?: string;
  unit: string;
  category?: string;
  weight: number;
  is_manufactured: boolean;
  is_direct_sale: boolean;
  commission_type?: string;
  commission_value?: number;
  tax_type?: string;
  icms?: string;
  ipi?: string;
  pis?: string;
  cofins?: string;
  created_at: string;
  updated_at: string;
}

export const useProducts = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const { toast } = useToast();
  const { user } = useAuth();

  const loadProducts = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      setError(null);
      console.log('[useProducts] Carregando produtos da empresa');
      
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('name');

      if (error) throw error;

      console.log('[useProducts] Produtos carregados:', data?.length);
      setProducts(data || []);
    } catch (error: any) {
      console.error('[useProducts] Erro ao carregar produtos:', error);
      const errorMessage = error.message || "Erro ao carregar produtos";
      setError(errorMessage);
      toast({
        title: "Erro",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const createProduct = async (productData: Omit<Product, 'id' | 'created_at' | 'updated_at'>) => {
    if (!user) throw new Error('Usuário não autenticado');

    try {
      const { data, error } = await supabase
        .from('products')
        .insert([{
          ...productData,
          user_id: user.id,
        }])
        .select()
        .single();

      if (error) throw error;

      await loadProducts();
      toast({
        title: "Sucesso",
        description: "Produto criado com sucesso!",
      });

      return data;
    } catch (error: any) {
      console.error('[useProducts] Erro ao criar produto:', error);
      toast({
        title: "Erro",
        description: error.message || "Erro ao criar produto",
        variant: "destructive",
      });
      throw error;
    }
  };

  const updateProduct = async (id: string, productData: Partial<Product>) => {
    try {
      const { error } = await supabase
        .from('products')
        .update(productData)
        .eq('id', id);

      if (error) throw error;

      await loadProducts();
      toast({
        title: "Sucesso",
        description: "Produto atualizado com sucesso!",
      });
    } catch (error: any) {
      console.error('[useProducts] Erro ao atualizar produto:', error);
      toast({
        title: "Erro",
        description: error.message || "Erro ao atualizar produto",
        variant: "destructive",
      });
      throw error;
    }
  };

  const deleteProduct = async (id: string) => {
    try {
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', id);

      if (error) throw error;

      await loadProducts();
      toast({
        title: "Sucesso",
        description: "Produto excluído com sucesso!",
      });
    } catch (error: any) {
      console.error('[useProducts] Erro ao excluir produto:', error);
      toast({
        title: "Erro",
        description: error.message || "Erro ao excluir produto",
        variant: "destructive",
      });
      throw error;
    }
  };

  const searchProducts = useCallback((searchTerm: string) => {
    if (!searchTerm?.trim()) return products;
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
  }, [products]);

  const filteredProducts = searchProducts(searchQuery);
  const refreshProducts = loadProducts;

  useEffect(() => {
    loadProducts();
  }, [user]);

  return {
    products: filteredProducts,
    loading,
    error,
    searchQuery,
    setSearchQuery,
    loadProducts,
    refreshProducts,
    searchProducts,
    createProduct,
    updateProduct,
    deleteProduct,
  };
};
