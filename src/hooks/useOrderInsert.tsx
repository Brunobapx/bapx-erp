
import { useState } from 'react';
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

export type OrderFormData = {
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

export const useOrderInsert = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const createOrder = async (orderData: OrderFormData) => {
    setIsSubmitting(true);
    
    try {
      // Simplificada verificação de autenticação usando apenas getSession
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError || !session?.user) {
        console.error('Usuário não autenticado:', sessionError);
        throw new Error('Você precisa estar logado para criar pedidos. Faça login novamente.');
      }

      const user = session.user;
      const totalAmount = orderData.items.reduce((sum, item) => sum + item.total_price, 0);

      console.log('[ORDER DEBUG] Criando pedido:', {
        userId: user.id,
        clientId: orderData.client_id,
        itemsCount: orderData.items.length,
        totalAmount
      });

      // Criar o pedido primeiro (operação simplificada)
      const orderInsertData = {
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
      };

      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert(orderInsertData)
        .select()
        .single();

      if (orderError) {
        console.error('[ORDER DEBUG] Erro ao criar pedido:', orderError);
        throw new Error(`Erro ao criar pedido: ${orderError.message}`);
      }

      console.log('[ORDER DEBUG] Pedido criado:', order.id);

      // Criar os itens do pedido
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
        console.error('[ORDER DEBUG] Erro ao criar itens:', itemsError);
        
        // Tentar excluir o pedido criado se houve erro nos itens
        await supabase.from('orders').delete().eq('id', order.id);
        throw new Error(`Erro ao criar itens do pedido: ${itemsError.message}`);
      }

      console.log('[ORDER DEBUG] Itens criados com sucesso');
      toast.success('Pedido criado com sucesso!');
      return order.id;
      
    } catch (error: any) {
      console.error('[ORDER DEBUG] Erro completo:', error);
      const errorMessage = error.message || 'Erro desconhecido ao criar pedido';
      toast.error(errorMessage);
      throw error;
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    createOrder,
    isSubmitting
  };
};
