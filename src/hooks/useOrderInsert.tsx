
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
      // Verificar sessão atual
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      console.log('[DEBUG] Verificação de sessão:', {
        hasSession: !!session,
        sessionError: sessionError?.message,
        user: session?.user ? { id: session.user.id, email: session.user.email } : null
      });

      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      console.log('[DEBUG] Resultado da autenticação:', {
        user: user ? { id: user.id, email: user.email } : null,
        userError: userError?.message,
        hasUser: !!user
      });
      
      if (userError || !user || !session) {
        console.error('[DEBUG] Erro de autenticação:', { userError, sessionError, hasUser: !!user, hasSession: !!session });
        throw new Error('Usuário não autenticado ou sessão inválida');
      }

      console.log('Criando pedido com dados:', {
        userId: user.id,
        clientId: orderData.client_id,
        itemsCount: orderData.items.length
      });

      const totalAmount = orderData.items.reduce((sum, item) => sum + item.total_price, 0);

      // TESTE: Verificar se consegue acessar outras tabelas primeiro
      try {
        const { data: testClients, error: testError } = await supabase
          .from('clients')
          .select('id')
          .limit(1);
        
        console.log('[DEBUG] Teste de conexão com tabela clients:', {
          success: !testError,
          clientsCount: testClients?.length || 0,
          testError: testError?.message
        });
      } catch (testErr) {
        console.error('[DEBUG] Erro no teste de conexão:', testErr);
      }

      // Criar o pedido com logs detalhados
      console.log('[DEBUG] Dados da inserção:', {
        user_id: user.id,
        client_id: orderData.client_id,
        client_name: orderData.client_name,
        total_amount: totalAmount
      });
      
      // TESTE CRÍTICO: Tentar SELECT primeiro para verificar se a tabela é visível
      try {
        const { data: testOrders, error: selectError } = await supabase
          .from('orders')
          .select('id')
          .limit(1);
        
        console.log('[DEBUG] Teste SELECT na tabela orders:', {
          success: !selectError,
          ordersCount: testOrders?.length || 0,
          selectError: selectError?.message,
          selectErrorCode: selectError?.code
        });
      } catch (selectErr) {
        console.error('[DEBUG] Erro no teste SELECT orders:', selectErr);
      }

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

      console.log('[DEBUG] Resultado da inserção do pedido:', {
        order: order ? { id: order.id, user_id: order.user_id } : null,
        orderError: orderError?.message,
        orderErrorCode: orderError?.code
      });

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
