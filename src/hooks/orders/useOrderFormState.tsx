
import { useState, useEffect } from 'react';
import { Order } from '@/hooks/useOrders';
import { useProducts } from '@/hooks/useProducts';

export interface OrderFormState {
  id: string;
  order_number: string;
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
  notes: string;
}

interface UseOrderFormStateProps {
  orderData: Order | null;
}

export const useOrderFormState = ({ orderData }: UseOrderFormStateProps) => {
  const { products } = useProducts();
  const [formData, setFormData] = useState<OrderFormState>({
    id: '',
    order_number: '',
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
    status: 'pending',
    notes: '',
  });
  
  const [formattedTotal, setFormattedTotal] = useState('R$ 0,00');
  
  const isNewOrder = !orderData?.id || orderData.id === 'NOVO';

  useEffect(() => {
    console.log("OrderData received:", orderData);
    
    if (orderData && orderData.id && orderData.id !== 'NOVO') {
      // Para pedidos existentes, usar o primeiro item do pedido
      const firstItem = orderData.order_items?.[0];
      
      setFormData({
        id: orderData.id?.toString() || '',
        order_number: orderData.order_number || '',
        client_id: orderData.client_id || '',
        client_name: orderData.client_name || '',
        product_id: firstItem?.product_id || '',
        product_name: firstItem?.product_name || '',
        quantity: firstItem?.quantity || 1,
        unit_price: firstItem?.unit_price || undefined,
        total_price: orderData.total_amount || undefined,
        delivery_deadline: orderData.delivery_deadline ? new Date(orderData.delivery_deadline) : null,
        payment_method: orderData.payment_method || '',
        payment_term: orderData.payment_term || '',
        seller: orderData.seller || '',
        status: orderData.status || 'pending',
        notes: orderData.notes || '',
      });
      
      updateFormattedTotal(orderData.total_amount);
    } else {
      resetForm();
    }
  }, [orderData, products]);

  const resetForm = () => {
    setFormData({
      id: '',
      order_number: '',
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
      status: 'pending',
      notes: '',
    });
    setFormattedTotal('R$ 0,00');
  };

  const formatCurrency = (value?: number) => {
    if (!value && value !== 0) return 'R$ 0,00';
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };
  
  const updateFormattedTotal = (total?: number) => {
    setFormattedTotal(formatCurrency(total));
  };

  return {
    formData,
    setFormData,
    formattedTotal,
    updateFormattedTotal,
    isNewOrder,
    formatCurrency,
    resetForm
  };
};
