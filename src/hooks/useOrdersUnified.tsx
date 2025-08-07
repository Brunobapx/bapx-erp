import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/components/Auth/AuthProvider';
import { checkStockAndSendToProduction } from './orders/stockProcessor';
import { validateStockForOrder, deductStockFromOrder, showStockValidationDialog } from './orders/stockValidationOnCreate';
import type { Order, OrderItem, OrderStatus, OrderFormData, OrderFilters, OrderSortOptions } from '@/types/orders';
import { isOrderCompleted as isCompletedUtil, OrderStatusLabels } from '@/types/orders';

export interface UseOrdersOptions {
  autoRefresh?: boolean;
  filters?: OrderFilters;
  sorting?: OrderSortOptions;
}

export const useOrdersUnified = (options: UseOrdersOptions = {}) => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const { toast } = useToast();
  const { user } = useAuth();

  // Função principal para carregar pedidos
  const loadOrders = useCallback(async (customFilters?: OrderFilters) => {
    try {
      setLoading(true);
      setError(null);

      if (!user) {
        throw new Error('Usuário não autenticado');
      }

      console.log('[useOrdersUnified] Carregando pedidos para usuário:', user.id);

      // Construir query base
      let query = supabase
        .from('orders')
        .select(`
          *,
          order_items (
            *,
            products (
              name,
              stock,
              is_manufactured,
              is_direct_sale
            )
          )
        `);

      // Aplicar filtros
      const activeFilters = customFilters || options.filters;
      if (activeFilters?.status) {
        query = query.eq('status', activeFilters.status);
      }

      if (activeFilters?.client) {
        query = query.ilike('client_name', `%${activeFilters.client}%`);
      }

      if (activeFilters?.seller) {
        query = query.eq('seller_id', activeFilters.seller);
      }

      if (activeFilters?.dateRange) {
        query = query
          .gte('created_at', activeFilters.dateRange.start.toISOString())
          .lte('created_at', activeFilters.dateRange.end.toISOString());
      }

      // Aplicar ordenação
      const sorting = options.sorting || { field: 'created_at', direction: 'desc' };
      query = query.order(sorting.field, { ascending: sorting.direction === 'asc' });

      const { data, error: fetchError } = await query;

      if (fetchError) throw fetchError;

      console.log('[useOrdersUnified] Pedidos carregados:', data?.length);
      setOrders(data || []);

    } catch (err: any) {
      console.error('[useOrdersUnified] Erro ao carregar pedidos:', err);
      setError(err.message);
      toast({
        title: "Erro",
        description: "Erro ao carregar pedidos: " + err.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [user, options.filters, options.sorting, toast]);

  // Criar novo pedido
  const createOrder = useCallback(async (orderData: OrderFormData): Promise<boolean> => {
    try {
      setSubmitting(true);

      if (!user) {
        throw new Error('Usuário não autenticado');
      }

      console.log('[useOrdersUnified] Criando pedido:', orderData);
      console.log('[useOrdersUnified] User ID:', user.id);
      console.log('[useOrdersUnified] User object:', user);

      // Verificar sessão atual
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      console.log('[useOrdersUnified] Sessão atual:', session);
      console.log('[useOrdersUnified] Erro de sessão:', sessionError);

      if (!session) {
        throw new Error('Sessão expirada. Faça login novamente.');
      }

      // Validar estoque antes de criar (adaptar tipos)
      const itemsForValidation = orderData.items.map(item => ({
        ...item,
        id: '',
        order_id: '',
        total_price: item.quantity * item.unit_price,
        created_at: '',
        updated_at: '',
        user_id: '',
        company_id: ''
      }));
      
      const stockValidation = await validateStockForOrder(itemsForValidation);
      if (!stockValidation.isValid) {
        const shouldContinue = await showStockValidationDialog(stockValidation);
        if (!shouldContinue) {
          return false;
        }
      }

      // Calcular total
      const totalAmount = orderData.items.reduce((sum, item) => sum + (item.quantity * item.unit_price), 0);

      // Criar pedido
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert({
          client_id: orderData.client_id,
          client_name: orderData.client_name,
          seller_id: orderData.seller_id,
          seller_name: orderData.seller_name,
          delivery_deadline: orderData.delivery_deadline?.toISOString().split('T')[0],
          payment_method: orderData.payment_method,
          payment_term: orderData.payment_term,
          notes: orderData.notes,
          total_amount: totalAmount,
          status: 'pending',
          user_id: user.id
        })
        .select()
        .single();

      if (orderError) throw orderError;

      // Criar itens do pedido
      const orderItems = orderData.items.map(item => ({
        order_id: order.id,
        product_id: item.product_id,
        product_name: item.product_name,
        quantity: item.quantity,
        unit_price: item.unit_price,
        total_price: item.quantity * item.unit_price,
        user_id: user.id
      }));

      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItems);

      if (itemsError) throw itemsError;

      // Abater estoque (adaptar tipos)
      const itemsForDeduction = orderData.items.map(item => ({
        ...item,
        id: '',
        order_id: '',
        total_price: item.quantity * item.unit_price,
        created_at: '',
        updated_at: '',
        user_id: '',
        company_id: ''
      }));
      
      // Passa o order.id para vincular a movimentação ao pedido
      await deductStockFromOrder(itemsForDeduction, order.id);

      // Processar pedido (estoque/produção)
      await checkStockAndSendToProduction(order.id);

      // Verificar se há produtos de venda direta e criar venda automaticamente
      try {
        const productIds = orderData.items.map(i => i.product_id);
        const { data: products, error: prodError } = await supabase
          .from('products')
          .select('id, is_direct_sale')
          .in('id', productIds);

        if (prodError) {
          console.warn('[useOrdersUnified] Erro ao buscar produtos para venda direta:', prodError);
        }

        const hasDirectSale = (products || []).some(p => p.is_direct_sale);
        if (hasDirectSale) {
          // Criar venda baseada no pedido
          const { data: sale, error: saleError } = await supabase
            .from('sales')
            .insert({
              user_id: user.id,
              order_id: order.id,
              client_id: orderData.client_id,
              client_name: orderData.client_name,
              total_amount: totalAmount,
              status: 'pending'
            })
            .select()
            .single();

          if (saleError) {
            console.warn('[useOrdersUnified] Falha ao criar venda automática:', saleError);
          } else {
            // Atualizar status do pedido para liberado para venda
            const { error: orderUpdateError } = await supabase
              .from('orders')
              .update({ status: 'released_for_sale' })
              .eq('id', order.id);
            if (orderUpdateError) {
              console.warn('[useOrdersUnified] Falha ao atualizar status do pedido:', orderUpdateError);
            }
            toast({ title: 'Sucesso', description: 'Pedido criado e enviado para vendas automaticamente' });
          }
        } else {
          toast({ title: 'Sucesso', description: 'Pedido criado com sucesso!' });
        }
      } catch (autoSaleErr) {
        console.warn('[useOrdersUnified] Erro ao processar venda automática:', autoSaleErr);
        toast({ title: 'Sucesso', description: 'Pedido criado com sucesso!' });
      }

      await loadOrders();
      return true;

    } catch (err: any) {
      console.error('[useOrdersUnified] Erro ao criar pedido:', err);
      toast({
        title: "Erro",
        description: "Erro ao criar pedido: " + err.message,
        variant: "destructive",
      });
      return false;
    } finally {
      setSubmitting(false);
    }
  }, [user, toast, loadOrders]);

  // Atualizar pedido
  const updateOrder = useCallback(async (orderId: string, updates: Partial<Order>): Promise<boolean> => {
    try {
      setSubmitting(true);

      const { error } = await supabase
        .from('orders')
        .update(updates)
        .eq('id', orderId);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Pedido atualizado com sucesso!",
      });

      await loadOrders();
      return true;

    } catch (err: any) {
      console.error('[useOrdersUnified] Erro ao atualizar pedido:', err);
      toast({
        title: "Erro",
        description: "Erro ao atualizar pedido: " + err.message,
        variant: "destructive",
      });
      return false;
    } finally {
      setSubmitting(false);
    }
  }, [toast, loadOrders]);

  // Cancelar pedido
  const cancelOrder = useCallback(async (orderId: string, reason?: string): Promise<boolean> => {
    try {
      const updates: Partial<Order> = {
        status: 'cancelled',
        notes: reason ? `Cancelado: ${reason}` : 'Pedido cancelado'
      };

      return await updateOrder(orderId, updates);
    } catch (err: any) {
      console.error('[useOrdersUnified] Erro ao cancelar pedido:', err);
      return false;
    }
  }, [updateOrder]);

  // Deletar pedido
  const deleteOrder = useCallback(async (orderId: string): Promise<boolean> => {
    try {
      setSubmitting(true);

      const { error } = await supabase
        .from('orders')
        .delete()
        .eq('id', orderId);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Pedido excluído com sucesso!",
      });

      await loadOrders();
      return true;

    } catch (err: any) {
      console.error('[useOrdersUnified] Erro ao excluir pedido:', err);
      toast({
        title: "Erro",
        description: "Erro ao excluir pedido: " + err.message,
        variant: "destructive",
      });
      return false;
    } finally {
      setSubmitting(false);
    }
  }, [toast, loadOrders]);

  // Enviar para produção
  const sendToProduction = useCallback(async (orderId: string): Promise<boolean> => {
    try {
      console.log('[useOrdersUnified] Enviando pedido para produção:', orderId);
      const success = await checkStockAndSendToProduction(orderId);
      
      if (success) {
        await loadOrders();
        toast({
          title: "Sucesso",
          description: "Pedido processado e enviado para produção/embalagem!",
        });
      }
      
      return success;
    } catch (err: any) {
      console.error('[useOrdersUnified] Erro ao enviar para produção:', err);
      toast({
        title: "Erro",
        description: "Erro ao processar pedido: " + err.message,
        variant: "destructive",
      });
      return false;
    }
  }, [loadOrders, toast]);

  // Buscar pedido por ID
  const getOrderById = useCallback((orderId: string): Order | undefined => {
    return orders.find(order => order.id === orderId);
  }, [orders]);

  // Filtrar pedidos
  const getOrdersByStatus = useCallback((status: OrderStatus): Order[] => {
    return orders.filter(order => order.status === status);
  }, [orders]);

  // Estatísticas
  const getOrderStats = useCallback(() => {
    const totalOrders = orders.length;
    const totalAmount = orders.reduce((sum, order) => sum + order.total_amount, 0);
    const pendingOrders = orders.filter(order => order.status === 'pending').length;
    const completedOrders = orders.filter(order => order.status === 'delivered').length;

    return {
      totalOrders,
      totalAmount,
      pendingOrders,
      completedOrders,
      averageOrderValue: totalOrders > 0 ? totalAmount / totalOrders : 0
    };
    }, [orders]);

  // Utilitários para compatibilidade
  const isOrderCompleted = useCallback((status: OrderStatus): boolean => {
    return isCompletedUtil(status);
  }, []);

  const getFirstOrderItem = useCallback((order: Order): OrderItem | undefined => {
    return order.order_items?.[0];
  }, []);

  const translateStatus = useCallback((status: OrderStatus): string => {
    return OrderStatusLabels[status] || status;
  }, []);

  // Auto-refresh
  useEffect(() => {
    loadOrders();
    
    if (options.autoRefresh) {
      const interval = setInterval(loadOrders, 30000); // 30 segundos
      return () => clearInterval(interval);
    }
  }, [loadOrders, options.autoRefresh]);

  return {
    // Estado
    orders,
    loading,
    submitting,
    error,
    
    // Ações principais
    loadOrders,
    createOrder,
    updateOrder,
    deleteOrder,
    cancelOrder,
    sendToProduction,
    
    // Utilitários
    getOrderById,
    getOrdersByStatus,
    getOrderStats,
    isOrderCompleted,
    getFirstOrderItem,
    translateStatus,
    
    // Aliases para compatibilidade
    refreshOrders: loadOrders,
    checkStockAndSendToProduction: sendToProduction
  };
};

// Export default para facilitar migration
export default useOrdersUnified;