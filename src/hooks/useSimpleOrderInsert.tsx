import { useState } from 'react';
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

export type SimpleOrderData = {
  client_id: string;
  client_name: string;
  seller?: string;
  delivery_deadline?: string;
  payment_method?: string;
  payment_term?: string;
  notes?: string;
  items: Array<{
    product_id: string;
    product_name: string;
    quantity: number;
    unit_price: number;
    total_price: number;
  }>;
};

export const useSimpleOrderInsert = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const createSimpleOrder = async (orderData: SimpleOrderData) => {
    setIsSubmitting(true);
    
    try {
      // Verificação simples de autenticação
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.user) {
        throw new Error('Usuário não autenticado');
      }

      const user = session.user;
      const totalAmount = orderData.items.reduce((sum, item) => sum + item.total_price, 0);

      console.log('[SIMPLE ORDER] Criando pedido:', {
        userId: user.id,
        clientId: orderData.client_id,
        total: totalAmount
      });

      // Criar pedido direto sem complicações
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert({
          user_id: user.id,
          client_id: orderData.client_id,
          client_name: orderData.client_name,
          seller: orderData.seller || null,
          delivery_deadline: orderData.delivery_deadline || null,
          payment_method: orderData.payment_method || null,
          payment_term: orderData.payment_term || null,
          notes: orderData.notes || null,
          total_amount: totalAmount,
          status: 'pending'
        })
        .select()
        .single();

      if (orderError) {
        console.error('[SIMPLE ORDER] Erro:', orderError);
        throw new Error(`Erro: ${orderError.message}`);
      }

      console.log('[SIMPLE ORDER] Pedido criado:', order.id);

      // Criar itens
      const orderItems = orderData.items.map(item => ({
        user_id: user.id,
        order_id: order.id,
        product_id: item.product_id,
        product_name: item.product_name,
        quantity: item.quantity,
        unit_price: item.unit_price,
        total_price: item.total_price
      }));

      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItems);

      if (itemsError) {
        console.error('[SIMPLE ORDER] Erro nos itens:', itemsError);
        // Limpar pedido se itens falharam
        await supabase.from('orders').delete().eq('id', order.id);
        throw new Error(`Erro nos itens: ${itemsError.message}`);
      }

      console.log('[SIMPLE ORDER] Sucesso completo');
      toast.success('Pedido criado com sucesso!');
      return order.id;
      
    } catch (error: any) {
      console.error('[SIMPLE ORDER] Erro geral:', error);
      toast.error(error.message || 'Erro desconhecido');
      throw error;
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    createSimpleOrder,
    isSubmitting
  };
};