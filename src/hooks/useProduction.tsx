import { useState, useEffect } from 'react';
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

export type ProductionStatus = 
  | 'pending'
  | 'in_progress'
  | 'completed'
  | 'approved'
  | 'rejected';

export type Production = {
  id: string;
  production_number: string;
  order_item_id: string;
  product_id: string;
  product_name: string;
  quantity_requested: number;
  quantity_produced: number;
  status: ProductionStatus;
  start_date?: string;
  completion_date?: string;
  approved_by?: string;
  approved_at?: string;
  notes?: string;
  created_at?: string;
  updated_at?: string;
  user_id?: string;
  order_number?: string;
  client_name?: string;
};

export const useProduction = () => {
  const [productions, setProductions] = useState<Production[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  useEffect(() => {
    const fetchProductions = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        
        if (userError || !user) {
          throw new Error('Usuário não autenticado');
        }

        const { data, error } = await supabase
          .from('production')
          .select(`
            *,
            order_items!inner(
              order_id,
              orders!inner(
                order_number,
                client_name
              )
            )
          `)
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });
        
        if (error) throw error;
        
        // Mapear os dados para incluir order_number e client_name
        const productionsWithOrderInfo = (data || []).map(prod => ({
          ...prod,
          order_number: prod.order_items?.orders?.order_number || '',
          client_name: prod.order_items?.orders?.client_name || ''
        }));
        
        setProductions(productionsWithOrderInfo);
      } catch (error: any) {
        console.error('Erro ao carregar produção:', error);
        setError(error.message || 'Erro ao carregar produção');
        toast.error('Erro ao carregar produção');
      } finally {
        setLoading(false);
      }
    };

    fetchProductions();
  }, [refreshTrigger]);

  const refreshProductions = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  // Função para abater ingredientes do estoque
  const deductIngredientsFromStock = async (productId: string, quantityProduced: number) => {
    try {
      // Buscar a receita do produto
      const { data: recipe, error: recipeError } = await supabase
        .from('product_recipes')
        .select('ingredient_id, quantity')
        .eq('product_id', productId);

      if (recipeError) {
        console.error('Erro ao buscar receita:', recipeError);
        return false;
      }

      if (!recipe || recipe.length === 0) {
        console.log('Produto não possui receita definida');
        return true; // Não é erro se não tem receita
      }

      // Para cada ingrediente da receita, abater do estoque
      for (const ingredient of recipe) {
        const quantityToDeduct = ingredient.quantity * quantityProduced;
        
        // Buscar estoque atual do ingrediente
        const { data: product, error: productError } = await supabase
          .from('products')
          .select('stock')
          .eq('id', ingredient.ingredient_id)
          .single();

        if (productError) {
          console.error('Erro ao buscar produto:', productError);
          continue;
        }

        const currentStock = product.stock || 0;
        const newStock = Math.max(0, currentStock - quantityToDeduct);

        // Atualizar estoque
        const { error: updateError } = await supabase
          .from('products')
          .update({ stock: newStock })
          .eq('id', ingredient.ingredient_id);

        if (updateError) {
          console.error('Erro ao atualizar estoque:', updateError);
          return false;
        }

        console.log(`Estoque atualizado: ${ingredient.ingredient_id}, quantidade deduzida: ${quantityToDeduct}, novo estoque: ${newStock}`);
      }

      return true;
    } catch (error) {
      console.error('Erro ao abater ingredientes do estoque:', error);
      return false;
    }
  };

  const updateProductionStatus = async (id: string, status: ProductionStatus, quantityProduced?: number) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      const updateData: any = { 
        status,
        updated_at: new Date().toISOString()
      };
      
      if (status === 'in_progress') {
        updateData.start_date = new Date().toISOString().split('T')[0];
        
        // Quando inicia a produção, abater ingredientes do estoque
        if (quantityProduced && quantityProduced > 0) {
          // Buscar dados da produção para obter o product_id
          const { data: productionData, error: fetchError } = await supabase
            .from('production')
            .select('product_id')
            .eq('id', id)
            .single();
          
          if (fetchError) {
            console.error('Erro ao buscar dados da produção:', fetchError);
            throw fetchError;
          }
          
          // Abater ingredientes do estoque
          const stockUpdateSuccess = await deductIngredientsFromStock(
            productionData.product_id, 
            quantityProduced
          );
          
          if (!stockUpdateSuccess) {
            toast.error('Aviso: Não foi possível atualizar completamente o estoque dos ingredientes');
          } else {
            toast.success('Produção iniciada e ingredientes deduzidos do estoque');
          }
        }
      }
      
      if (status === 'completed' || status === 'approved') {
        updateData.completion_date = new Date().toISOString().split('T')[0];
        if (quantityProduced !== undefined) {
          updateData.quantity_produced = quantityProduced;
        }
      }
      
      if (status === 'approved') {
        updateData.approved_at = new Date().toISOString();
        updateData.approved_by = user?.email || 'Sistema';
        
        // Garantir que temos a quantidade produzida
        const finalQuantityProduced = quantityProduced || 0;
        if (finalQuantityProduced <= 0) {
          toast.error('Quantidade produzida deve ser maior que zero');
          return false;
        }
        
        updateData.quantity_produced = finalQuantityProduced;
        
        // Primeiro, atualizar a produção com a quantidade produzida
        const { error: updateError } = await supabase
          .from('production')
          .update(updateData)
          .eq('id', id);
        
        if (updateError) throw updateError;
        
        // Buscar dados da produção atualizada
        const { data: productionData, error: fetchError } = await supabase
          .from('production')
          .select('*')
          .eq('id', id)
          .single();
        
        if (fetchError) {
          console.error('Erro ao buscar dados da produção:', fetchError);
          throw fetchError;
        }
        
        // Buscar estoque atual do produto
        const { data: productData, error: productError } = await supabase
          .from('products')
          .select('stock')
          .eq('id', productionData.product_id)
          .single();
        
        if (productError) {
          console.error('Erro ao buscar produto:', productError);
          throw productError;
        }
        
        const currentStock = productData.stock || 0;
        
        // Calcular quantidade total para embalagem (estoque anterior + produzido)
        const totalQuantityForPackaging = currentStock + finalQuantityProduced;
        
        // Zerar o estoque do produto (tudo vai para embalagem)
        const { error: stockUpdateError } = await supabase
          .from('products')
          .update({ 
            stock: 0, // Zerando o estoque pois tudo vai para embalagem
            updated_at: new Date().toISOString()
          })
          .eq('id', productionData.product_id);
        
        if (stockUpdateError) {
          console.error('Erro ao atualizar estoque do produto:', stockUpdateError);
          toast.error('Erro ao atualizar estoque do produto');
        } else {
          console.log(`Estoque do produto ${productionData.product_id} zerado. Quantidade total para embalagem: ${totalQuantityForPackaging} (${currentStock} estoque anterior + ${finalQuantityProduced} produzidos)`);
        }
        
        // Verificar se já existe um registro de embalagem para esta produção
        const { data: existingPackaging, error: checkError } = await supabase
          .from('packaging')
          .select('id')
          .eq('production_id', id)
          .maybeSingle();
        
        if (checkError) {
          console.error('Erro ao verificar embalagem existente:', checkError);
        }
        
        if (existingPackaging) {
          // Atualizar o registro existente com a quantidade total para embalagem
          const { error: packagingUpdateError } = await supabase
            .from('packaging')
            .update({
              quantity_to_package: totalQuantityForPackaging,
              status: 'pending',
              updated_at: new Date().toISOString()
            })
            .eq('production_id', id);
          
          if (packagingUpdateError) {
            console.error('Erro ao atualizar embalagem:', packagingUpdateError);
            toast.error('Erro ao atualizar registro de embalagem');
          } else {
            console.log('Embalagem atualizada com quantidade total:', totalQuantityForPackaging);
            toast.success(`Produção aprovada! Total para embalagem: ${totalQuantityForPackaging} unidades (${currentStock} do estoque + ${finalQuantityProduced} produzidas). Estoque zerado.`);
          }
        } else {
          // Criar novo registro de embalagem com a quantidade total
          const { error: packagingError } = await supabase
            .from('packaging')
            .insert({
              user_id: user?.id,
              production_id: id,
              product_id: productionData.product_id,
              product_name: productionData.product_name,
              quantity_to_package: totalQuantityForPackaging,
              quantity_packaged: 0,
              status: 'pending'
            });
          
          if (packagingError) {
            console.error('Erro ao criar embalagem:', packagingError);
            toast.error('Erro ao criar registro de embalagem');
          } else {
            console.log('Embalagem criada com quantidade total:', totalQuantityForPackaging);
            toast.success(`Produção aprovada! Total para embalagem: ${totalQuantityForPackaging} unidades (${currentStock} do estoque + ${finalQuantityProduced} produzidas). Estoque zerado.`);
          }
        }
        
        refreshProductions();
        return true;
      }

      // Para outros status, apenas atualizar a produção normalmente
      const { error } = await supabase
        .from('production')
        .update(updateData)
        .eq('id', id);
      
      if (error) throw error;
      
      toast.success('Status de produção atualizado com sucesso');
      refreshProductions();
      return true;
    } catch (error: any) {
      console.error('Erro ao atualizar produção:', error);
      toast.error('Erro ao atualizar produção');
      return false;
    }
  };

  return {
    productions,
    loading,
    error,
    refreshProductions,
    updateProductionStatus
  };
};
