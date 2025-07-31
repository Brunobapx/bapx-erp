
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
      // Múltiplas verificações de autenticação para garantir que o usuário está logado
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) {
        console.error('Erro ao verificar sessão:', sessionError);
        throw new Error('Erro na verificação de autenticação');
      }

      if (!session?.user) {
        console.error('Usuário não autenticado - sessão não encontrada');
        throw new Error('Você precisa estar logado para criar pedidos');
      }

      const user = session.user;

      // Verificação adicional do usuário
      const { data: { user: currentUser }, error: userError } = await supabase.auth.getUser();
      
      if (userError || !currentUser || currentUser.id !== user.id) {
        console.error('Erro na verificação do usuário atual:', userError);
        throw new Error('Sessão inválida. Faça login novamente.');
      }

      console.log('Criando pedido com dados:', {
        userId: user.id,
        userEmail: user.email,
        clientId: orderData.client_id,
        itemsCount: orderData.items.length
      });

      const totalAmount = orderData.items.reduce((sum, item) => sum + item.total_price, 0);

      // Criar o pedido com dados explícitos
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

      console.log('Inserindo pedido na tabela orders:', orderInsertData);

      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert(orderInsertData)
        .select()
        .single();

      if (orderError) {
        console.error('Erro detalhado ao criar pedido:', {
          error: orderError,
          code: orderError.code,
          message: orderError.message,
          details: orderError.details,
          hint: orderError.hint
        });
        
        // Tratar erros específicos
        if (orderError.code === '23505') {
          throw new Error('Erro de duplicação de dados. Tente novamente.');
        } else if (orderError.code === '23503') {
          throw new Error('Dados de referência inválidos. Verifique cliente e produtos.');
        } else if (orderError.code === '23502') {
          throw new Error('Dados obrigatórios não fornecidos.');
        } else if (orderError.code === '42P01') {
          throw new Error('Tabela não encontrada. Verifique a configuração do banco.');
        } else if (orderError.message?.includes('RLS')) {
          throw new Error('Erro de permissão. Verifique se você está autenticado.');
        }
        
        throw new Error(`Erro ao criar pedido: ${orderError.message}`);
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

      console.log('Inserindo itens do pedido:', orderItems);

      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItems);

      if (itemsError) {
        console.error('Erro detalhado ao criar itens:', {
          error: itemsError,
          code: itemsError.code,
          message: itemsError.message,
          items: orderItems
        });
        
        // Tentar excluir o pedido criado se houve erro nos itens
        try {
          await supabase.from('orders').delete().eq('id', order.id);
          console.log('Pedido excluído devido ao erro nos itens');
        } catch (deleteError) {
          console.error('Erro ao excluir pedido após falha nos itens:', deleteError);
        }
        
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
