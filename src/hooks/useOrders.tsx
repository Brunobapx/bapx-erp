import { useState, useEffect } from 'react';
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

export type OrderStatus = 
  | 'pending'
  | 'in_production'
  | 'in_packaging'
  | 'packaged'
  | 'released_for_sale'
  | 'sale_confirmed'
  | 'in_delivery'
  | 'delivered'
  | 'cancelled';

export type Order = {
  id: string;
  order_number: string;
  client_id: string;
  client_name: string;
  seller?: string;
  status: OrderStatus;
  total_amount: number;
  delivery_deadline?: string;
  payment_method?: string;
  payment_term?: string;
  notes?: string;
  created_at?: string;
  updated_at?: string;
  user_id?: string;
  order_items?: OrderItem[];
};

export type OrderItem = {
  id: string;
  order_id: string;
  product_id: string;
  product_name: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  created_at?: string;
  updated_at?: string;
  user_id?: string;
};

export const useOrders = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        
        if (userError || !user) {
          throw new Error('Usuário não autenticado');
        }

        const { data, error } = await supabase
          .from('orders')
          .select(`
            *,
            order_items (*)
          `)
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });
        
        if (error) throw error;
        
        setOrders(data || []);
      } catch (error: any) {
        console.error('Erro ao carregar pedidos:', error);
        setError(error.message || 'Erro ao carregar pedidos');
        toast.error('Erro ao carregar pedidos');
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, [refreshTrigger]);

  const refreshOrders = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  const deleteOrder = async (id: string) => {
    try {
      const { error } = await supabase
        .from('orders')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      
      toast.success('Pedido excluído com sucesso');
      refreshOrders();
      return true;
    } catch (error: any) {
      console.error('Erro ao excluir pedido:', error);
      toast.error('Erro ao excluir pedido');
      return false;
    }
  };

  // Função para abater ingredientes do estoque
  const deductIngredientsFromStock = async (productId: string, quantityProduced: number) => {
    try {
      console.log(`Iniciando abatimento para produto ${productId}, quantidade: ${quantityProduced}`);
      
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

      console.log('Receita encontrada:', recipe);

      // Para cada ingrediente da receita, abater do estoque
      for (const ingredient of recipe) {
        const quantityToDeduct = ingredient.quantity * quantityProduced;
        
        console.log(`Abatendo ingrediente ${ingredient.ingredient_id}: ${quantityToDeduct}`);
        
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

        console.log(`Estoque atual: ${currentStock}, novo estoque: ${newStock}`);

        // Atualizar estoque
        const { error: updateError } = await supabase
          .from('products')
          .update({ stock: newStock })
          .eq('id', ingredient.ingredient_id);

        if (updateError) {
          console.error('Erro ao atualizar estoque:', updateError);
          return false;
        }

        console.log(`Estoque atualizado com sucesso para ${ingredient.ingredient_id}`);
      }

      return true;
    } catch (error) {
      console.error('Erro ao abater ingredientes do estoque:', error);
      return false;
    }
  };

  // Função para verificar estoque e enviar automaticamente para produção ou embalagem
  const checkStockAndSendToProduction = async (orderId: string) => {
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError || !user) {
        throw new Error('Usuário não autenticado');
      }

      console.log(`Verificando estoque para pedido ${orderId}`);

      // Get order with items
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .select(`
          *,
          order_items (*)
        `)
        .eq('id', orderId)
        .single();
      
      if (orderError) throw orderError;
      if (!order) throw new Error('Pedido não encontrado');

      let needsProduction = false;
      let hasDirectPackaging = false;
      const productionEntries = [];
      const packagingEntries = [];

      // Para cada item do pedido, verificar estoque
      for (const item of order.order_items) {
        console.log(`Verificando item: ${item.product_name}, quantidade solicitada: ${item.quantity}`);
        
        // Buscar dados do produto (estoque e se é fabricado)
        const { data: productData, error: productError } = await supabase
          .from('products')
          .select('stock, is_manufactured')
          .eq('id', item.product_id)
          .single();

        if (productError) {
          console.error('Erro ao buscar produto:', productError);
          continue;
        }

        const currentStock = productData.stock || 0;
        const quantityNeeded = item.quantity;
        const shortage = quantityNeeded - currentStock;

        console.log(`Produto: ${item.product_name}, Estoque atual: ${currentStock}, Necessário: ${quantityNeeded}, Falta: ${shortage}`);

        // Se há estoque suficiente, enviar direto para embalagem
        if (shortage <= 0) {
          console.log(`Enviando ${quantityNeeded} unidades de ${item.product_name} diretamente para embalagem`);
          
          // Criar entrada de embalagem diretamente (production_id será null)
          packagingEntries.push({
            user_id: user.id,
            production_id: null, // NULL para produtos que vão direto do estoque
            product_id: item.product_id,
            product_name: item.product_name,
            quantity_to_package: quantityNeeded,
            quantity_packaged: 0,
            status: 'pending'
          });

          // Deduzir a quantidade do estoque
          const { error: stockUpdateError } = await supabase
            .from('products')
            .update({ 
              stock: currentStock - quantityNeeded,
              updated_at: new Date().toISOString()
            })
            .eq('id', item.product_id);

          if (stockUpdateError) {
            console.error('Erro ao atualizar estoque:', stockUpdateError);
            toast.error(`Erro ao atualizar estoque do produto ${item.product_name}`);
          } else {
            console.log(`Estoque do produto ${item.product_name} atualizado: ${currentStock} -> ${currentStock - quantityNeeded}`);
          }

          hasDirectPackaging = true;
        } else if (shortage > 0 && productData.is_manufactured) {
          // Se há falta de estoque e o produto é fabricado, enviar para produção
          console.log(`Enviando ${shortage} unidades de ${item.product_name} para produção`);
          
          productionEntries.push({
            user_id: user.id,
            order_item_id: item.id,
            product_id: item.product_id,
            product_name: item.product_name,
            quantity_requested: shortage,
            status: 'pending'
          });

          needsProduction = true;

          // Se há estoque parcial, enviar o que tem direto para embalagem
          if (currentStock > 0) {
            console.log(`Enviando ${currentStock} unidades de ${item.product_name} (estoque disponível) diretamente para embalagem`);
            
            packagingEntries.push({
              user_id: user.id,
              production_id: null, // NULL para produtos que vão direto do estoque
              product_id: item.product_id,
              product_name: item.product_name,
              quantity_to_package: currentStock,
              quantity_packaged: 0,
              status: 'pending'
            });

            // Zerar o estoque pois foi liberado para embalagem
            const { error: stockUpdateError } = await supabase
              .from('products')
              .update({ 
                stock: 0,
                updated_at: new Date().toISOString()
              })
              .eq('id', item.product_id);

            if (stockUpdateError) {
              console.error('Erro ao atualizar estoque:', stockUpdateError);
            } else {
              console.log(`Estoque do produto ${item.product_name} zerado após liberar ${currentStock} unidades para embalagem`);
            }

            hasDirectPackaging = true;
          }
        } else if (shortage > 0 && !productData.is_manufactured) {
          console.log(`Produto ${item.product_name} não é fabricado e há falta de estoque. Será necessário reposição manual.`);
          toast.error(`Produto ${item.product_name} tem estoque insuficiente e não é fabricado. Reposição manual necessária.`);
        }
      }

      // Criar entradas de produção se necessário
      if (productionEntries.length > 0) {
        const { data: createdProductions, error: productionError } = await supabase
          .from('production')
          .insert(productionEntries)
          .select();
        
        if (productionError) throw productionError;

        console.log(`Criadas ${productionEntries.length} entradas de produção`);

        // Abater ingredientes do estoque para cada item enviado para produção
        for (const entry of productionEntries) {
          console.log(`Abatendo ingredientes para produção de ${entry.quantity_requested} unidades de ${entry.product_name}`);
          
          const stockUpdateSuccess = await deductIngredientsFromStock(
            entry.product_id, 
            entry.quantity_requested
          );
          
          if (!stockUpdateSuccess) {
            toast.error(`Aviso: Não foi possível atualizar completamente o estoque dos ingredientes para ${entry.product_name}`);
          } else {
            console.log(`Ingredientes abatidos com sucesso para ${entry.product_name}`);
          }
        }
      }

      // Criar entradas de embalagem se necessário
      if (packagingEntries.length > 0) {
        const { data: createdPackagings, error: packagingError } = await supabase
          .from('packaging')
          .insert(packagingEntries)
          .select();
        
        if (packagingError) throw packagingError;

        console.log(`Criadas ${packagingEntries.length} entradas de embalagem`);
      }

      // Atualizar status do pedido baseado no que foi criado
      let newStatus: OrderStatus = 'pending';
      let message = '';

      if (hasDirectPackaging && needsProduction) {
        newStatus = 'in_packaging';
        message = `Pedido criado! ${packagingEntries.length} item(ns) enviado(s) para embalagem (estoque disponível) e ${productionEntries.length} item(ns) para produção (falta de estoque).`;
      } else if (hasDirectPackaging && !needsProduction) {
        newStatus = 'in_packaging';
        message = `Pedido criado! Todos os itens enviados diretamente para embalagem (estoque suficiente).`;
      } else if (!hasDirectPackaging && needsProduction) {
        newStatus = 'in_production';
        message = `Pedido criado! ${productionEntries.length} item(ns) enviado(s) para produção devido à falta de estoque.`;
      } else {
        message = 'Pedido criado com sucesso!';
      }

      await supabase
        .from('orders')
        .update({ 
          status: newStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', orderId);

      toast.success(message);
      return true;
    } catch (error: any) {
      console.error('Erro ao verificar estoque e processar pedido:', error);
      toast.error('Erro ao processar verificação de estoque');
      return false;
    }
  };

  const sendToProduction = async (orderId: string) => {
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError || !user) {
        throw new Error('Usuário não autenticado');
      }

      // Get order with items
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .select(`
          *,
          order_items (*)
        `)
        .eq('id', orderId)
        .single();
      
      if (orderError) throw orderError;
      if (!order) throw new Error('Pedido não encontrado');

      // Create production entries for each order item
      const productionEntries = order.order_items.map((item: OrderItem) => ({
        user_id: user.id,
        order_item_id: item.id,
        product_id: item.product_id,
        product_name: item.product_name,
        quantity_requested: item.quantity,
        status: 'pending'
      }));

      const { data: createdProductions, error: productionError } = await supabase
        .from('production')
        .insert(productionEntries)
        .select();
      
      if (productionError) throw productionError;

      // Abater ingredientes do estoque para cada item de produção criado
      for (const item of order.order_items) {
        // Verificar se o produto é fabricado
        const { data: productData, error: productError } = await supabase
          .from('products')
          .select('is_manufactured')
          .eq('id', item.product_id)
          .single();

        if (productError) {
          console.error('Erro ao verificar produto:', productError);
          continue;
        }

        // Se for produto fabricado, abater ingredientes
        if (productData.is_manufactured) {
          console.log(`Produto ${item.product_name} é fabricado, abatendo ingredientes...`);
          
          const stockUpdateSuccess = await deductIngredientsFromStock(
            item.product_id, 
            item.quantity
          );
          
          if (!stockUpdateSuccess) {
            toast.error(`Aviso: Não foi possível atualizar completamente o estoque dos ingredientes para ${item.product_name}`);
          } else {
            console.log(`Ingredientes abatidos com sucesso para ${item.product_name}`);
          }
        } else {
          console.log(`Produto ${item.product_name} não é fabricado, pulando abatimento de ingredientes`);
        }
      }

      // Update order status
      const { error: updateError } = await supabase
        .from('orders')
        .update({ 
          status: 'in_production',
          updated_at: new Date().toISOString()
        })
        .eq('id', orderId);
      
      if (updateError) throw updateError;
      
      toast.success('Pedido enviado para produção e ingredientes abatidos do estoque');
      refreshOrders();
      return true;
    } catch (error: any) {
      console.error('Erro ao enviar para produção:', error);
      toast.error('Erro ao enviar para produção');
      return false;
    }
  };

  // Função para traduzir status para português
  const translateStatus = (status: OrderStatus): string => {
    const statusTranslations: Record<OrderStatus, string> = {
      'pending': 'Pendente',
      'in_production': 'Em Produção',
      'in_packaging': 'Em Embalagem',
      'packaged': 'Embalado',
      'released_for_sale': 'Liberado para Venda',
      'sale_confirmed': 'Venda Confirmada',
      'in_delivery': 'Em Entrega',
      'delivered': 'Entregue',
      'cancelled': 'Cancelado'
    };
    return statusTranslations[status] || status;
  };

  const formatCurrency = (value?: number) => {
    if (!value && value !== 0) return 'R$ 0,00';
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const getOrderById = (id: string) => {
    return orders.find(order => order.id === id) || null;
  };

  // Função auxiliar para verificar se um pedido está completo
  const isOrderCompleted = (status: OrderStatus) => {
    return ['delivered', 'cancelled'].includes(status);
  };

  // Função auxiliar para obter o primeiro item do pedido
  const getFirstOrderItem = (order: Order) => {
    return order.order_items?.[0] || null;
  };

  return {
    orders,
    loading,
    error,
    refreshOrders,
    deleteOrder,
    sendToProduction,
    checkStockAndSendToProduction,
    formatCurrency,
    getOrderById,
    isOrderCompleted,
    getFirstOrderItem,
    translateStatus
  };
};
