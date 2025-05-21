
import { useState, useEffect } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Order } from '@/hooks/useOrders';
import { useProducts } from '@/hooks/useProducts';

interface OrderFormState {
  id: string;
  client_id: string;
  client_name: string;
  product_id: string;
  product_name: string;
  quantity: number;
  unit_price?: number;
  total_price?: number;
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
  // Import products from hooks
  const { products } = useProducts();
  
  // Form state
  const [formData, setFormData] = useState<OrderFormState>({
    id: '',
    client_id: '',
    client_name: '',
    product_id: '',
    product_name: '',
    quantity: 1,
    unit_price: undefined,
    total_price: undefined,
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
  const [formattedTotal, setFormattedTotal] = useState('R$ 0,00');

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
        unit_price: undefined, // We'll need to fetch this from products
        total_price: undefined,
        delivery_deadline: orderData.delivery_deadline ? new Date(orderData.delivery_deadline) : null,
        payment_method: orderData.payment_method || '',
        payment_term: orderData.payment_term || '',
        seller: orderData.seller || '',
        status: orderData.status || 'Novo Pedido',
      });
      
      // If we have a product_id, look up its price
      if (orderData.product_id) {
        const product = products.find(p => p.id === orderData.product_id);
        if (product?.price) {
          setFormData(prev => ({
            ...prev,
            unit_price: product.price,
            total_price: product.price * (orderData.quantity || 1)
          }));
          updateFormattedTotal(product.price * (orderData.quantity || 1));
        }
      }
    } else {
      resetForm();
    }
  }, [orderData, products]);

  // Reset form to initial values
  const resetForm = () => {
    setFormData({
      id: '',
      client_id: '',
      client_name: '',
      product_id: '',
      product_name: '',
      quantity: 1,
      unit_price: undefined,
      total_price: undefined,
      delivery_deadline: null,
      payment_method: '',
      payment_term: '',
      seller: '',
      status: 'Novo Pedido',
    });
    setFormattedTotal('R$ 0,00');
  };

  // Format currency for display
  const formatCurrency = (value?: number) => {
    if (!value && value !== 0) return 'R$ 0,00';
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };
  
  // Update the formatted total display
  const updateFormattedTotal = (total?: number) => {
    setFormattedTotal(formatCurrency(total));
  };

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
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  // Handle client selection
  const handleClientSelect = (clientId: string, clientName: string) => {
    setFormData(prev => ({
      ...prev,
      client_id: clientId,
      client_name: clientName
    }));
  };

  // Handle product selection
  const handleProductSelect = (productId: string, productName: string, productPrice?: number) => {
    const newFormData = {
      ...formData,
      product_id: productId,
      product_name: productName,
      unit_price: productPrice
    };
    
    setFormData(newFormData);
    
    // Calculate total if we have both quantity and price
    if (newFormData.quantity && productPrice) {
      const total = newFormData.quantity * productPrice;
      setFormData(prev => ({
        ...prev,
        product_id: productId,
        product_name: productName,
        unit_price: productPrice,
        total_price: total
      }));
      updateFormattedTotal(total);
    }
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
        unit_price: formData.unit_price,
        total_price: formData.total_price,
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
    handleSubmit,
    calculateTotal,
    formattedTotal
  };
};
