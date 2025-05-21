
import { useState, useEffect } from 'react';
import { Order } from '@/hooks/useOrders';
import { useProducts } from '@/hooks/useProducts';

export interface OrderFormState {
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

interface UseOrderFormStateProps {
  orderData: Order | null;
}

export const useOrderFormState = ({ orderData }: UseOrderFormStateProps) => {
  const { products } = useProducts();
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
  
  // UI state
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
