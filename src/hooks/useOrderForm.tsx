
import { useState, useEffect } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Order } from '@/hooks/useOrders';
import { Client } from '@/hooks/useClients';
import { Product } from '@/hooks/useProducts';

interface OrderFormState {
  id: string;
  client_id: string;
  client_name: string;
  product_id: string;
  product_name: string;
  quantity: number;
  delivery_deadline: Date | null;
  payment_method: string;
  payment_term: string;
  seller: string;
  status: string;
}

interface UseOrderFormProps {
  orderData: Order | null;
  onClose: (refresh?: boolean) => void;
}

export const useOrderForm = ({ orderData, onClose }: UseOrderFormProps) => {
  // Form state
  const [formData, setFormData] = useState<OrderFormState>({
    id: '',
    client_id: '',
    client_name: '',
    product_id: '',
    product_name: '',
    quantity: 1,
    delivery_deadline: null,
    payment_method: '',
    payment_term: '',
    seller: '',
    status: 'Novo Pedido',
  });

  // UI states
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [openClientCombobox, setOpenClientCombobox] = useState(false);
  const [openProductCombobox, setOpenProductCombobox] = useState(false);
  const [openCalendar, setOpenCalendar] = useState(false);

  // Determine if this is a new order
  const isNewOrder = !orderData?.id || orderData.id === 'NOVO';

  // Initialize form with order data if available
  useEffect(() => {
    if (orderData && orderData.id && orderData.id !== 'NOVO') {
      setFormData({
        id: orderData.id?.toString() || '',
        client_id: orderData.client_id || '',
        client_name: orderData.client_name || '',
        product_id: orderData.product_id || '',
        product_name: orderData.product_name || '',
        quantity: orderData.quantity || 1,
        delivery_deadline: orderData.delivery_deadline ? new Date(orderData.delivery_deadline) : null,
        payment_method: orderData.payment_method || '',
        payment_term: orderData.payment_term || '',
        seller: orderData.seller || '',
        status: orderData.status || 'Novo Pedido',
      });
    } else {
      resetForm();
    }
  }, [orderData]);

  // Reset form to initial values
  const resetForm = () => {
    setFormData({
      id: '',
      client_id: '',
      client_name: '',
      product_id: '',
      product_name: '',
      quantity: 1,
      delivery_deadline: null,
      payment_method: '',
      payment_term: '',
      seller: '',
      status: 'Novo Pedido',
    });
  };

  // Handle input changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Handle client selection
  const handleClientSelect = (clientId: string) => {
    const selectedClient = clients.find(client => client.id === clientId);
    if (selectedClient) {
      setFormData(prev => ({
        ...prev,
        client_id: selectedClient.id,
        client_name: selectedClient.name
      }));
    }
    setOpenClientCombobox(false);
  };

  // Handle product selection
  const handleProductSelect = (productId: string) => {
    const selectedProduct = products.find(product => product.id === productId);
    if (selectedProduct) {
      setFormData(prev => ({
        ...prev,
        product_id: selectedProduct.id,
        product_name: selectedProduct.name
      }));
    }
    setOpenProductCombobox(false);
  };

  // Handle date selection
  const handleDateSelect = (date: Date | null) => {
    setFormData(prev => ({
      ...prev,
      delivery_deadline: date
    }));
    setOpenCalendar(false);
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
      
      const orderPayload = {
        client_id: formData.client_id,
        client_name: formData.client_name,
        product_id: formData.product_id,
        product_name: formData.product_name,
        quantity: formData.quantity,
        delivery_deadline: formData.delivery_deadline,
        payment_method: formData.payment_method,
        payment_term: formData.payment_term,
        seller: formData.seller,
        status: formData.status
      };
      
      if (isNewOrder) {
        const { error } = await supabase.from('orders').insert([orderPayload]);
        if (error) throw error;
        toast.success("Pedido criado com sucesso");
      } else {
        const { error } = await supabase
          .from('orders')
          .update(orderPayload)
          .eq('id', formData.id);
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
    formData,
    isSubmitting,
    isNewOrder,
    openClientCombobox,
    setOpenClientCombobox,
    openProductCombobox,
    setOpenProductCombobox,
    openCalendar,
    setOpenCalendar,
    handleChange,
    handleClientSelect,
    handleProductSelect,
    handleDateSelect,
    handleSubmit
  };
};

// Temporary placeholder for testing
// In a real implementation, these would be fetched from the API
const clients: Client[] = [];
const products: Product[] = [];
