
import { supabase } from "@/integrations/supabase/client";

/**
 * Função para abater ingredientes do estoque conforme a receita do produto.
 */
export const deductIngredientsFromStock = async (productId: string, quantityProduced: number) => {
  try {
    console.log(`[STOCK DEBUG] Iniciando abatimento para produto ${productId}, quantidade: ${quantityProduced}`);
      
    // Buscar a receita do produto
    const { data: recipe, error: recipeError } = await supabase
      .from('product_recipes')
      .select('ingredient_id, quantity')
      .eq('product_id', productId);

    if (recipeError) {
      console.error('[STOCK DEBUG] Erro ao buscar receita:', recipeError);
      return false;
    }

    if (!recipe || recipe.length === 0) {
      console.log('[STOCK DEBUG] Produto não possui receita definida');
      return true; // Não é erro se não tem receita
    }

    console.log('[STOCK DEBUG] Receita encontrada:', recipe);

    // Para cada ingrediente da receita, abater do estoque
    for (const ingredient of recipe) {
      const quantityToDeduct = ingredient.quantity * quantityProduced;
        
      console.log(`[STOCK DEBUG] Abatendo ingrediente ${ingredient.ingredient_id}: ${quantityToDeduct}`);
        
      // Buscar estoque atual do ingrediente
      const { data: product, error: productError } = await supabase
        .from('products')
        .select('stock')
        .eq('id', ingredient.ingredient_id)
        .single();

      if (productError) {
        console.error('[STOCK DEBUG] Erro ao buscar produto:', productError);
        continue;
      }

      const currentStock = product.stock || 0;
      const newStock = Math.max(0, currentStock - quantityToDeduct);

      console.log(`[STOCK DEBUG] Estoque atual: ${currentStock}, novo estoque: ${newStock}`);

      // Atualizar estoque
      const { error: updateError } = await supabase
        .from('products')
        .update({ stock: newStock })
        .eq('id', ingredient.ingredient_id);

      if (updateError) {
        console.error('[STOCK DEBUG] Erro ao atualizar estoque:', updateError);
        return false;
      }

      console.log(`[STOCK DEBUG] Estoque atualizado com sucesso para ${ingredient.ingredient_id}`);
    }

    return true;
  } catch (error) {
    console.error('[STOCK DEBUG] Erro ao abater ingredientes do estoque:', error);
    return false;
  }
};
