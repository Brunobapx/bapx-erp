
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
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError || !user) {
        throw new Error('Usuário não autenticado');
      }

      console.log('Criando pedido com dados:', {
        userId: user.id,
        clientId: orderData.client_id,
        itemsCount: orderData.items.length
      });

      const totalAmount = orderData.items.reduce((sum, item) => sum + item.total_price, 0);

      // Criar o pedido
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert({
          user_id: user.id,
          client_id: orderData.client_id,
          client_name: orderData.client_name,
          seller: orderData.seller,
          delivery_deadline: orderData.delivery_deadline,
          payment_method: orderData.payment_method,
          payment_term: orderData.payment_term,
          notes: orderData.notes,
          total_amount: totalAmount,
          status: 'pending'
        })
        .select()
        .single();

      if (orderError) {
        console.error('Erro ao criar pedido:', orderError);
        
        // Tratar erros específicos
        if (orderError.code === '23505') {
          throw new Error('Erro de duplicação de dados. Tente novamente.');
        } else if (orderError.code === '23503') {
          throw new Error('Dados de referência inválidos. Verifique cliente e produtos.');
        } else if (orderError.code === '23502') {
          throw new Error('Dados obrigatórios não fornecidos.');
        }
        
        throw orderError;
      }

      console.log('Pedido criado com sucesso:', order.id);

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
        console.error('Erro ao criar itens do pedido:', itemsError);
        
        // Tentar excluir o pedido criado se houve erro nos itens
        await supabase.from('orders').delete().eq('id', order.id);
        
        throw new Error('Erro ao criar itens do pedido: ' + itemsError.message);
      }

      console.log('Itens do pedido criados com sucesso');
      toast.success('Pedido criado com sucesso!');
      return order.id;
      
    } catch (error: any) {
      console.error('Erro completo ao criar pedido:', error);
      
      // Mostrar mensagem de erro mais específica
      const errorMessage = error.message || 'Erro desconhecido ao criar pedido';
      toast.error('Erro ao criar pedido: ' + errorMessage);
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
