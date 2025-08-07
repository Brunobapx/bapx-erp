import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface StockMovement {
  id?: string;
  user_id: string;
  product_id: string;
  product_name: string;
  movement_type: 'entrada' | 'saida' | 'ajuste' | 'producao' | 'venda';
  quantity: number;
  previous_stock: number;
  new_stock: number;
  reason: string;
  reference_id?: string; // ID do pedido, produção, etc.
  reference_type?: string; // 'order', 'production', 'manual', etc.
  created_at?: string;
}

export const useStockMovements = () => {
  
  /**
   * Registra uma movimentação de estoque
   */
  const logStockMovement = async (movement: Omit<StockMovement, 'id' | 'created_at'>) => {
    try {
      console.log('[STOCK MOVEMENT] Registrando movimentação:', movement);

      const { error } = await supabase
        .from('stock_movements')
        .insert([movement]);

      if (error) {
        console.error('[STOCK MOVEMENT] Erro ao registrar movimentação:', error);
        // Não interrompe o fluxo, apenas loga o erro
        return false;
      }

      console.log('[STOCK MOVEMENT] Movimentação registrada com sucesso');
      return true;
    } catch (error) {
      console.error('[STOCK MOVEMENT] Erro ao registrar movimentação:', error);
      return false;
    }
  };

  /**
   * Atualiza estoque de um produto e registra a movimentação
   */
  const updateProductStock = async (
    productId: string,
    newStock: number,
    movementData: {
      movement_type: StockMovement['movement_type'];
      quantity: number;
      reason: string;
      reference_id?: string;
      reference_type?: string;
    }
  ) => {
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError || !user) {
        throw new Error('Usuário não autenticado');
      }

      // Buscar produto atual
      const { data: product, error: productError } = await supabase
        .from('products')
        .select('name, stock')
        .eq('id', productId)
        .single();

      if (productError) {
        throw new Error(`Erro ao buscar produto: ${productError.message}`);
      }

      const previousStock = product.stock || 0;

      // Atualizar estoque
      const { error: updateError } = await supabase
        .from('products')
        .update({ stock: newStock })
        .eq('id', productId);

      if (updateError) {
        throw new Error(`Erro ao atualizar estoque: ${updateError.message}`);
      }

      // Registrar movimentação
      await logStockMovement({
        user_id: user.id,
        product_id: productId,
        product_name: product.name,
        movement_type: movementData.movement_type,
        quantity: movementData.quantity,
        previous_stock: previousStock,
        new_stock: newStock,
        reason: movementData.reason,
        reference_id: movementData.reference_id,
        reference_type: movementData.reference_type
      });

      console.log(`[STOCK UPDATE] ${product.name}: ${previousStock} -> ${newStock}`);
      return true;

    } catch (error: any) {
      console.error('[STOCK UPDATE] Erro:', error);
      toast.error(error.message);
      return false;
    }
  };

  /**
   * Busca movimentações de estoque
   */
  const getStockMovements = async (filters?: {
    productId?: string;
    movementType?: string;
    startDate?: string;
    endDate?: string;
    limit?: number;
  }) => {
    try {
      let query = supabase
        .from('stock_movements')
        .select('*')
        .order('created_at', { ascending: false });

      if (filters?.productId) {
        query = query.eq('product_id', filters.productId);
      }

      if (filters?.movementType) {
        query = query.eq('movement_type', filters.movementType);
      }

      if (filters?.startDate) {
        query = query.gte('created_at', filters.startDate);
      }

      if (filters?.endDate) {
        query = query.lte('created_at', filters.endDate);
      }

      if (filters?.limit) {
        query = query.limit(filters.limit);
      }

      const { data, error } = await query;

      if (error) {
        throw new Error(`Erro ao buscar movimentações: ${error.message}`);
      }

      return data || [];
    } catch (error: any) {
      console.error('[STOCK MOVEMENTS] Erro ao buscar movimentações:', error);
      toast.error(error.message);
      return [];
    }
  };

  /**
   * Verifica se um produto está com estoque baixo
   */
  const checkLowStock = async (productId: string, minStockLevel: number = 10) => {
    try {
      const { data: product, error } = await supabase
        .from('products')
        .select('name, stock')
        .eq('id', productId)
        .single();

      if (error || !product) {
        return false;
      }

      return (product.stock || 0) <= minStockLevel;
    } catch (error) {
      console.error('[LOW STOCK CHECK] Erro:', error);
      return false;
    }
  };

  return {
    logStockMovement,
    updateProductStock,
    getStockMovements,
    checkLowStock
  };
};