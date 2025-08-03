import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export type OrderItemTrackingStatus = 
  | 'pending'
  | 'partial_ready' 
  | 'complete_ready';

export type OrderItemTracking = {
  id: string;
  order_item_id: string;
  quantity_target: number;
  quantity_from_stock: number;
  quantity_from_production: number;
  quantity_produced_approved: number;
  quantity_packaged_approved: number;
  status: OrderItemTrackingStatus;
  notes?: string;
  created_at?: string;
  updated_at?: string;
  user_id: string;
};

export const useOrderItemTracking = () => {
  const [trackings, setTrackings] = useState<OrderItemTracking[]>([]);
  const [loading, setLoading] = useState(false);

  const loadTrackings = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('order_item_tracking')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTrackings(data || []);
    } catch (error: any) {
      console.error('Erro ao carregar trackings:', error);
      toast.error('Erro ao carregar rastreamento de itens');
    } finally {
      setLoading(false);
    }
  };

  // Criar tracking para um item do pedido
  const createTracking = async (
    orderItemId: string,
    quantityTarget: number,
    quantityFromStock: number,
    quantityFromProduction: number,
    userId: string
  ): Promise<string | null> => {
    try {
      const { data, error } = await supabase
        .from('order_item_tracking')
        .insert({
          order_item_id: orderItemId,
          quantity_target: quantityTarget,
          quantity_from_stock: quantityFromStock,
          quantity_from_production: quantityFromProduction,
          status: 'pending',
          user_id: userId
        })
        .select()
        .single();

      if (error) throw error;
      
      console.log('[TRACKING] Criado tracking:', data);
      return data.id;
    } catch (error: any) {
      console.error('Erro ao criar tracking:', error);
      toast.error('Erro ao criar rastreamento do item');
      return null;
    }
  };

  // Atualizar quantidade produzida aprovada
  const updateProductionApproved = async (
    trackingId: string,
    quantityProducedApproved: number
  ): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('order_item_tracking')
        .update({
          quantity_produced_approved: quantityProducedApproved,
          status: 'partial_ready'
        })
        .eq('id', trackingId);

      if (error) throw error;
      
      console.log(`[TRACKING] Atualizada produção aprovada: ${quantityProducedApproved} para tracking ${trackingId}`);
      return true;
    } catch (error: any) {
      console.error('Erro ao atualizar produção aprovada:', error);
      return false;
    }
  };

  // Atualizar quantidade final aprovada na embalagem
  const updatePackagingApproved = async (
    trackingId: string,
    quantityPackagedApproved: number
  ): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('order_item_tracking')
        .update({
          quantity_packaged_approved: quantityPackagedApproved,
          status: 'complete_ready'
        })
        .eq('id', trackingId);

      if (error) throw error;
      
      console.log(`[TRACKING] Atualizada embalagem aprovada: ${quantityPackagedApproved} para tracking ${trackingId}`);
      return true;
    } catch (error: any) {
      console.error('Erro ao atualizar embalagem aprovada:', error);
      return false;
    }
  };

  // Verificar se todos os itens de um pedido estão prontos
  const canReleaseOrderForSale = async (orderId: string): Promise<boolean> => {
    try {
      const { data: orderItems, error: itemsError } = await supabase
        .from('order_items')
        .select('id')
        .eq('order_id', orderId);

      if (itemsError) throw itemsError;

      const { data: trackings, error: trackingError } = await supabase
        .from('order_item_tracking')
        .select('status')
        .in('order_item_id', orderItems?.map(item => item.id) || []);

      if (trackingError) throw trackingError;

      const allReady = trackings?.every(t => t.status === 'complete_ready') || false;
      
      console.log(`[TRACKING] Verificação pedido ${orderId}: ${allReady ? 'PODE' : 'NÃO PODE'} ser liberado`);
      return allReady;
    } catch (error: any) {
      console.error('Erro ao verificar se pedido pode ser liberado:', error);
      return false;
    }
  };

  // Recalcular valores do pedido baseado nas quantidades aprovadas
  const recalculateOrderValues = async (orderId: string): Promise<boolean> => {
    try {
      console.log(`[TRACKING] Recalculando valores do pedido ${orderId}`);

      // Buscar itens do pedido com seus trackings
      const { data: orderItems, error: itemsError } = await supabase
        .from('order_items')
        .select(`
          id,
          unit_price,
          order_item_tracking!order_item_tracking_order_item_id_fkey(*)
        `)
        .eq('order_id', orderId);

      if (itemsError) throw itemsError;

      let totalAmount = 0;

      // Atualizar cada item com a quantidade aprovada final
      for (const item of orderItems || []) {
        const tracking = item.order_item_tracking?.[0];
        if (tracking && tracking.quantity_packaged_approved > 0) {
          const newTotalPrice = tracking.quantity_packaged_approved * item.unit_price;
          
          // Atualizar item
          const { error: updateError } = await supabase
            .from('order_items')
            .update({
              quantity: tracking.quantity_packaged_approved,
              total_price: newTotalPrice
            })
            .eq('id', item.id);

          if (updateError) throw updateError;
          
          totalAmount += newTotalPrice;
          console.log(`[TRACKING] Item ${item.id}: quantidade ${tracking.quantity_packaged_approved}, valor ${newTotalPrice}`);
        }
      }

      // Atualizar total do pedido
      const { error: orderError } = await supabase
        .from('orders')
        .update({ total_amount: totalAmount })
        .eq('id', orderId);

      if (orderError) throw orderError;

      console.log(`[TRACKING] Pedido ${orderId} recalculado: novo total ${totalAmount}`);
      toast.success(`Valores do pedido recalculados: R$ ${totalAmount.toFixed(2)}`);
      return true;
    } catch (error: any) {
      console.error('Erro ao recalcular valores do pedido:', error);
      toast.error('Erro ao recalcular valores do pedido');
      return false;
    }
  };

  useEffect(() => {
    loadTrackings();
  }, []);

  return {
    trackings,
    loading,
    loadTrackings,
    createTracking,
    updateProductionApproved,
    updatePackagingApproved,
    canReleaseOrderForSale,
    recalculateOrderValues
  };
};