
import { useState } from 'react';
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { OrderFormState } from './useOrderFormState';

interface UseOrderFormActionsProps {
  formData: OrderFormState;
  setFormData: (data: OrderFormState | ((prev: OrderFormState) => OrderFormState)) => void;
  updateFormattedTotal: (total?: number) => void;
  isNewOrder: boolean;
  onClose: (refresh?: boolean) => void;
}

export const useOrderFormActions = ({
  formData,
  setFormData,
  updateFormattedTotal,
  isNewOrder,
  onClose
}: UseOrderFormActionsProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleClientSelect = (clientId: string, clientName: string) => {
    setFormData(prev => ({ ...prev, client_id: clientId, client_name: clientName }));
  };

  const handleDateSelect = (date: Date | null) => {
    setFormData(prev => ({ ...prev, delivery_deadline: date }));
  };

  const validateForm = () => {
    if (!formData.client_id.trim()) {
      toast.error("Cliente é obrigatório");
      return false;
    }

    if (formData.items.length === 0) {
      toast.error("Adicione pelo menos um item ao pedido");
      return false;
    }

    for (const item of formData.items) {
      if (!item.product_id.trim()) {
        toast.error("Todos os itens devem ter um produto selecionado");
        return false;
      }
      if (!item.quantity || item.quantity <= 0) {
        toast.error("Todos os itens devem ter quantidade maior que zero");
        return false;
      }
    }

    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    try {
      setIsSubmitting(true);
      
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError || !user) {
        toast.error("Usuário não autenticado. Faça login para continuar.");
        return;
      }

      if (isNewOrder) {
        // Criar novo pedido
        const orderData = {
          user_id: user.id,
          client_id: formData.client_id,
          client_name: formData.client_name,
          seller: formData.seller || null,
          total_amount: formData.total_amount,
          delivery_deadline: formData.delivery_deadline?.toISOString().split('T')[0] || null,
          payment_method: formData.payment_method || null,
          payment_term: formData.payment_term || null,
          notes: formData.notes || null,
          status: 'pending'
        };
        
        const { data: insertedOrder, error: orderError } = await supabase
          .from('orders')
          .insert([orderData])
          .select()
          .single();
          
        if (orderError) throw orderError;
        
        // Criar todos os itens do pedido
        const itemsData = formData.items.map(item => ({
          user_id: user.id,
          order_id: insertedOrder.id,
          product_id: item.product_id,
          product_name: item.product_name,
          quantity: item.quantity,
          unit_price: item.unit_price,
          total_price: item.total_price
        }));
        
        const { error: itemsError } = await supabase
          .from('order_items')
          .insert(itemsData);
          
        if (itemsError) throw itemsError;
        
        toast.success("Pedido criado com sucesso");
      } else {
        // Atualizar pedido existente
        const orderData = {
          client_id: formData.client_id,
          client_name: formData.client_name,
          seller: formData.seller || null,
          total_amount: formData.total_amount,
          delivery_deadline: formData.delivery_deadline?.toISOString().split('T')[0] || null,
          payment_method: formData.payment_method || null,
          payment_term: formData.payment_term || null,
          notes: formData.notes || null,
          updated_at: new Date().toISOString()
        };
        
        const { error: orderError } = await supabase
          .from('orders')
          .update(orderData)
          .eq('id', formData.id);
          
        if (orderError) throw orderError;
        
        // Deletar itens existentes e recriar
        const { error: deleteError } = await supabase
          .from('order_items')
          .delete()
          .eq('order_id', formData.id);
          
        if (deleteError) throw deleteError;
        
        // Recriar todos os itens
        const itemsData = formData.items.map(item => ({
          user_id: user.id,
          order_id: formData.id,
          product_id: item.product_id,
          product_name: item.product_name,
          quantity: item.quantity,
          unit_price: item.unit_price,
          total_price: item.total_price
        }));
        
        const { error: itemsError } = await supabase
          .from('order_items')
          .insert(itemsData);
          
        if (itemsError) throw itemsError;
        
        toast.success("Pedido atualizado com sucesso");
      }
      
      onClose(true);
    } catch (error: any) {
      console.error("Erro ao salvar pedido:", error);
      toast.error(`Erro ao ${isNewOrder ? 'criar' : 'atualizar'} pedido: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    isSubmitting,
    handleChange,
    handleClientSelect,
    handleDateSelect,
    handleSubmit
  };
};
