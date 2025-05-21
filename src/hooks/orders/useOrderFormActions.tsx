
import { useState } from 'react';
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { OrderFormState } from './useOrderFormState';

interface UseOrderFormActionsProps {
  formData: OrderFormState;
  setFormData: React.Dispatch<React.SetStateAction<OrderFormState>>;
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
  
  // Calculate total based on quantity and unit price
  const calculateTotal = () => {
    if (formData.quantity && formData.unit_price) {
      const total = formData.quantity * formData.unit_price;
      setFormData(prev => ({
        ...prev,
        total_price: total
      }));
      updateFormattedTotal(total);
    }
  };

  // Handle input changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    
    // Handle numeric inputs
    if (name === 'quantity' || name === 'unit_price') {
      const numValue = name === 'quantity' 
        ? parseInt(value, 10) || 0
        : parseFloat(value) || 0;
        
      setFormData(prev => ({
        ...prev,
        [name]: numValue
      }));
      
      // Recalculate total when quantity or unit_price changes
      setTimeout(calculateTotal, 0);
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
    
    // Log the change for debugging
    console.log(`Field ${name} changed to:`, value);
  };

  // Handle client selection
  const handleClientSelect = (clientId: string, clientName: string) => {
    console.log("Client selected:", clientId, clientName);
    setFormData(prev => ({
      ...prev,
      client_id: clientId,
      client_name: clientName
    }));
  };

  // Handle product selection
  const handleProductSelect = (productId: string, productName: string, productPrice?: number) => {
    console.log("Product selected:", productId, productName, "Price:", productPrice);
    
    // Update form data with the new product info
    setFormData(prev => ({
      ...prev,
      product_id: productId,
      product_name: productName,
      unit_price: productPrice || prev.unit_price
    }));
    
    // Calculate total if we have both quantity and price
    setTimeout(() => {
      if (formData.quantity && productPrice) {
        const total = formData.quantity * productPrice;
        setFormData(prev => ({
          ...prev,
          total_price: total
        }));
        updateFormattedTotal(total);
      }
    }, 0);
  };

  // Handle date selection
  const handleDateSelect = (date: Date | null) => {
    console.log("Date selected:", date);
    setFormData(prev => ({
      ...prev,
      delivery_deadline: date
    }));
  };

  // Form validation
  const validateForm = () => {
    if (!formData.client_name) {
      toast.error("Cliente é obrigatório");
      return false;
    }
    if (!formData.product_name) {
      toast.error("Produto é obrigatório");
      return false;
    }
    if (formData.quantity <= 0) {
      toast.error("Quantidade deve ser maior que zero");
      return false;
    }
    return true;
  };

  // Handle form submission
  const handleSubmit = async () => {
    if (!validateForm()) return;
    
    try {
      setIsSubmitting(true);
      console.log("Submitting form with data:", formData);
      
      const orderPayload = {
        client_id: formData.client_id,
        client_name: formData.client_name,
        product_id: formData.product_id,
        product_name: formData.product_name,
        quantity: formData.quantity,
        unit_price: formData.unit_price,
        total_price: formData.total_price,
        delivery_deadline: formData.delivery_deadline,
        payment_method: formData.payment_method,
        payment_term: formData.payment_term,
        seller: formData.seller,
        status: formData.status
      };
      
      console.log("Order payload:", orderPayload);
      
      if (isNewOrder) {
        const { data, error } = await supabase.from('orders').insert([orderPayload]);
        console.log("Insert response:", { data, error });
        
        if (error) throw error;
        toast.success("Pedido criado com sucesso");
      } else {
        const { error } = await supabase
          .from('orders')
          .update(orderPayload)
          .eq('id', formData.id);
          
        console.log("Update result:", { error });
        
        if (error) throw error;
        toast.success("Pedido atualizado com sucesso");
      }
      
      onClose(true); // Pass true to refresh the orders list
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
