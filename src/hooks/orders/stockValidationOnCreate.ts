import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface OrderItem {
  product_id: string;
  product_name: string;
  quantity: number;
  unit_price: number;
  total_price: number;
}

export interface StockValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  insufficientStock: Array<{
    productName: string;
    required: number;
    available: number;
  }>;
}

/**
 * Valida se há estoque suficiente para todos os itens do pedido
 */
export const validateStockForOrder = async (items: OrderItem[]): Promise<StockValidationResult> => {
  const result: StockValidationResult = {
    isValid: true,
    errors: [],
    warnings: [],
    insufficientStock: []
  };

  try {
    console.log('[STOCK VALIDATION] Validando estoque para pedido:', items);

    for (const item of items) {
      // Buscar dados do produto
      const { data: product, error: productError } = await supabase
        .from('products')
        .select('name, stock, is_direct_sale, is_manufactured')
        .eq('id', item.product_id)
        .single();

      if (productError) {
        console.error('[STOCK VALIDATION] Erro ao buscar produto:', productError);
        result.errors.push(`Erro ao verificar produto ${item.product_name}`);
        result.isValid = false;
        continue;
      }

      if (!product) {
        result.errors.push(`Produto ${item.product_name} não encontrado`);
        result.isValid = false;
        continue;
      }

      const currentStock = product.stock || 0;
      const required = item.quantity;

      console.log(`[STOCK VALIDATION] ${product.name}: estoque=${currentStock}, necessário=${required}`);

      // Para produtos de venda direta ou manufaturados, apenas avisar se não há estoque
      if (product.is_direct_sale || product.is_manufactured) {
        if (currentStock < required) {
          result.warnings.push(
            `${product.name}: Estoque insuficiente (${currentStock} disponível, ${required} necessário). Produto será enviado para produção/embalagem.`
          );
        }
      } else {
        // Para produtos normais, verificar estoque obrigatório
        if (currentStock < required) {
          result.insufficientStock.push({
            productName: product.name,
            required: required,
            available: currentStock
          });
          result.errors.push(
            `${product.name}: Estoque insuficiente (${currentStock} disponível, ${required} necessário)`
          );
          result.isValid = false;
        }
      }
    }

    console.log('[STOCK VALIDATION] Resultado da validação:', result);
    return result;

  } catch (error) {
    console.error('[STOCK VALIDATION] Erro na validação:', error);
    result.isValid = false;
    result.errors.push('Erro interno na validação de estoque');
    return result;
  }
};

/**
 * Abate o estoque dos produtos após criar o pedido com log de movimentação
 */
export const deductStockFromOrder = async (items: OrderItem[], orderId?: string): Promise<boolean> => {
  try {
    console.log('[STOCK DEDUCTION] Iniciando abatimento de estoque:', items);

    const { data: { user }, error: userError } = await supabase.auth.getUser();
      
    if (userError || !user) {
      console.error('[STOCK DEDUCTION] Usuário não autenticado');
      return false;
    }

    for (const item of items) {
      // Buscar estoque atual
      const { data: product, error: productError } = await supabase
        .from('products')
        .select('stock, name, is_direct_sale, is_manufactured')
        .eq('id', item.product_id)
        .single();

      if (productError) {
        console.error('[STOCK DEDUCTION] Erro ao buscar produto:', productError);
        toast.error(`Erro ao atualizar estoque do produto ${item.product_name}`);
        return false;
      }

      const currentStock = product.stock || 0;
      const quantityToDeduct = item.quantity;

      // Para produtos normais (não manufaturados e não venda direta), abater o estoque
      if (!product.is_manufactured && !product.is_direct_sale) {
        const newStock = Math.max(0, currentStock - quantityToDeduct);
        
        console.log(`[STOCK DEDUCTION] ${product.name}: ${currentStock} -> ${newStock} (abatendo ${quantityToDeduct})`);

        // Atualizar estoque no banco
        const { error: updateError } = await supabase
          .from('products')
          .update({ stock: newStock })
          .eq('id', item.product_id);

        if (updateError) {
          console.error('[STOCK DEDUCTION] Erro ao atualizar estoque:', updateError);
          toast.error(`Erro ao atualizar estoque do produto ${product.name}`);
          return false;
        }

        // Tentar registrar movimentação de estoque (não crítico)
        try {
          const movementData = {
            user_id: user.id,
            product_id: item.product_id,
            product_name: product.name,
            movement_type: 'saida' as const,
            quantity: quantityToDeduct,
            previous_stock: currentStock,
            new_stock: newStock,
            reason: `Abatimento por pedido`,
            reference_id: orderId,
            reference_type: 'order'
          };

          const { error: movementError } = await supabase
            .from('stock_movements')
            .insert([movementData]);

          if (movementError) {
            console.warn('[STOCK DEDUCTION] Erro ao registrar movimentação (não crítico):', movementError);
          } else {
            console.log(`[STOCK DEDUCTION] Movimentação registrada: ${product.name}`);
          }
        } catch (movError) {
          console.warn('[STOCK DEDUCTION] Erro ao registrar movimentação (não crítico):', movError);
        }

        console.log(`[STOCK DEDUCTION] Estoque atualizado com sucesso: ${product.name}`);
      } else {
        console.log(`[STOCK DEDUCTION] ${product.name}: produto manufaturado/venda direta, não abatendo estoque diretamente`);
      }
    }

    console.log('[STOCK DEDUCTION] Abatimento de estoque concluído com sucesso');
    return true;

  } catch (error) {
    console.error('[STOCK DEDUCTION] Erro no abatimento de estoque:', error);
    toast.error('Erro ao atualizar estoque dos produtos');
    return false;
  }
};

/**
 * Mostra dialog de confirmação quando há problemas de estoque
 */
export const showStockValidationDialog = (validation: StockValidationResult): Promise<boolean> => {
  return new Promise((resolve) => {
    if (validation.isValid && validation.warnings.length === 0) {
      resolve(true);
      return;
    }

    let message = '';
    
    if (validation.errors.length > 0) {
      message += 'PROBLEMAS DE ESTOQUE:\n';
      message += validation.errors.join('\n');
      message += '\n\n';
    }

    if (validation.warnings.length > 0) {
      message += 'AVISOS:\n';
      message += validation.warnings.join('\n');
      message += '\n\n';
    }

    if (validation.isValid) {
      message += 'Deseja continuar mesmo assim?';
      
      if (window.confirm(message)) {
        resolve(true);
      } else {
        resolve(false);
      }
    } else {
      message += 'Não é possível criar o pedido com estes problemas.';
      toast.error(message);
      resolve(false);
    }
  });
};