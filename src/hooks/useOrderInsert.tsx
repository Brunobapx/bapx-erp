
import { useState } from 'react';
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useCompanies } from "./useCompanies";

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
  const { getUserCompanyId } = useCompanies();

  const createOrder = async (orderData: OrderFormData) => {
    setIsSubmitting(true);
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError || !user) {
        throw new Error('Usuário não autenticado');
      }

      const companyId = await getUserCompanyId();
      if (!companyId) {
        throw new Error('Company ID não encontrado');
      }

      const totalAmount = orderData.items.reduce((sum, item) => sum + item.total_price, 0);

      // Criar o pedido
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert({
          user_id: user.id,
          company_id: companyId,
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

      if (orderError) throw orderError;

      // Criar os itens do pedido
      const orderItems = orderData.items.map(item => ({
        user_id: user.id,
        company_id: companyId,
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

      if (itemsError) throw itemsError;

      toast.success('Pedido criado com sucesso!');
      return order.id;
      
    } catch (error: any) {
      console.error('Erro ao criar pedido:', error);
      toast.error('Erro ao criar pedido: ' + (error.message || 'Erro desconhecido'));
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
