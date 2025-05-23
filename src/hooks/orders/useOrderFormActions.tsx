
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

  const calculateTotal = () => {
    const quantity = Number(formData.quantity) || 0;
    const unitPrice = Number(formData.unit_price) || 0;
    const total = quantity * unitPrice;
    
    setFormData(prev => ({ ...prev, total_price: total }));
    updateFormattedTotal(total);
    
    return total;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleClientSelect = (clientId: string, clientName: string) => {
    setFormData(prev => ({ ...prev, client_id: clientId, client_name: clientName }));
  };

  const handleProductSelect = (productId: string, productName: string, productPrice?: number) => {
    setFormData(prev => ({ 
      ...prev, 
      product_id: productId, 
      product_name: productName,
      unit_price: productPrice || prev.unit_price
    }));
    
    if (productPrice) {
      setTimeout(() => calculateTotal(), 100);
    }
  };

  const handleDateSelect = (date: Date | null) => {
    setFormData(prev => ({ ...prev, delivery_deadline: date }));
  };

  const validateForm = () => {
    if (!formData.client_id.trim()) {
      toast.error("Cliente é obrigatório");
      return false;
    }

    if (!formData.product_id.trim()) {
      toast.error("Produto é obrigatório");
      return false;
    }

    if (!formData.quantity || formData.quantity <= 0) {
      toast.error("Quantidade deve ser maior que zero");
      return false;
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

      const totalPrice = calculateTotal();
      
      if (isNewOrder) {
        // Criar novo pedido
        const orderData = {
          user_id: user.id,
          client_id: formData.client_id,
          client_name: formData.client_name,
          seller: formData.seller || null,
          total_amount: totalPrice,
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
        
        // Criar item do pedido
        const itemData = {
          user_id: user.id,
          order_id: insertedOrder.id,
          product_id: formData.product_id,
          product_name: formData.product_name,
          quantity: formData.quantity,
          unit_price: formData.unit_price || 0,
          total_price: totalPrice
        };
        
        const { error: itemError } = await supabase
          .from('order_items')
          .insert([itemData]);
          
        if (itemError) throw itemError;
        
        toast.success("Pedido criado com sucesso");
      } else {
        // Atualizar pedido existente
        const orderData = {
          client_id: formData.client_id,
          client_name: formData.client_name,
          seller: formData.seller || null,
          total_amount: totalPrice,
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
    calculateTotal,
    handleChange,
    handleClientSelect,
    handleProductSelect,
    handleDateSelect,
    handleSubmit
  };
};
