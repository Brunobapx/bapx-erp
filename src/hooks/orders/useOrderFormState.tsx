
import { useState, useEffect } from 'react';
import { Order } from '@/hooks/useOrders';
import { useProducts } from '@/hooks/useProducts';

export interface OrderFormItem {
  id: string;
  product_id: string;
  product_name: string;
  quantity: number;
  unit_price: number;
  total_price: number;
}

export interface OrderFormState {
  id: string;
  order_number: string;
  client_id: string;
  client_name: string;
  items: OrderFormItem[];
  delivery_deadline: Date | null;
  payment_method: string;
  payment_term: string;
  seller: string;
  status: string;
  notes: string;
  total_amount: number;
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
    items: [],
    delivery_deadline: null,
    payment_method: '',
    payment_term: '',
    seller: '',
    status: 'pending',
    notes: '',
    total_amount: 0,
  });
  
  const [formattedTotal, setFormattedTotal] = useState('R$ 0,00');
  
  const isNewOrder = !orderData?.id || orderData.id === 'NOVO';

  useEffect(() => {
    console.log("OrderFormState - OrderData received:", orderData);
    
    if (orderData && orderData.id && orderData.id !== 'NOVO') {
      // Para pedidos existentes, carregar todos os itens
      const items: OrderFormItem[] = orderData.order_items?.map(item => ({
        id: item.id,
        product_id: item.product_id,
        product_name: item.product_name,
        quantity: item.quantity,
        unit_price: item.unit_price,
        total_price: item.total_price,
      })) || [];
      
      console.log("OrderFormState - Loading existing order with items:", items);
      
      setFormData({
        id: orderData.id?.toString() || '',
        order_number: orderData.order_number || '',
        client_id: orderData.client_id || '',
        client_name: orderData.client_name || '',
        items,
        delivery_deadline: orderData.delivery_deadline ? new Date(orderData.delivery_deadline) : null,
        payment_method: orderData.payment_method || '',
        payment_term: orderData.payment_term || '',
        seller: orderData.seller || '',
        status: orderData.status || 'pending',
        notes: orderData.notes || '',
        total_amount: orderData.total_amount || 0,
      });
      
      updateFormattedTotal(orderData.total_amount);
    } else {
      console.log("OrderFormState - Resetting form for new order");
      resetForm();
    }
  }, [orderData, products]);

  const resetForm = () => {
    setFormData({
      id: '',
      order_number: '',
      client_id: '',
      client_name: '',
      items: [],
      delivery_deadline: null,
      payment_method: '',
      payment_term: '',
      seller: '',
      status: 'pending',
      notes: '',
      total_amount: 0,
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

  const calculateTotalAmount = (items: OrderFormItem[]) => {
    return items.reduce((sum, item) => sum + item.total_price, 0);
  };

  const addItem = () => {
    console.log("OrderFormState - Adding new item");
    const newItem: OrderFormItem = {
      id: `temp-${Date.now()}-${Math.random()}`,
      product_id: '',
      product_name: '',
      quantity: 1,
      unit_price: 0,
      total_price: 0,
    };
    
    setFormData(prev => {
      const newItems = [...prev.items, newItem];
      const newTotal = calculateTotalAmount(newItems);
      updateFormattedTotal(newTotal);
      return {
        ...prev,
        items: newItems,
        total_amount: newTotal
      };
    });
  };

  const removeItem = (itemId: string) => {
    console.log("OrderFormState - Removing item:", itemId);
    setFormData(prev => {
      const newItems = prev.items.filter(item => item.id !== itemId);
      const newTotal = calculateTotalAmount(newItems);
      updateFormattedTotal(newTotal);
      return {
        ...prev,
        items: newItems,
        total_amount: newTotal
      };
    });
  };

  const updateItem = (itemId: string, updates: Partial<OrderFormItem>) => {
    console.log("OrderFormState - Updating item:", itemId, updates);
    setFormData(prev => {
      const newItems = prev.items.map(item => {
        if (item.id === itemId) {
          const updatedItem = { ...item, ...updates };
          // Recalcular total do item
          updatedItem.total_price = updatedItem.quantity * updatedItem.unit_price;
          return updatedItem;
        }
        return item;
      });
      
      const newTotal = calculateTotalAmount(newItems);
      updateFormattedTotal(newTotal);
      
      return {
        ...prev,
        items: newItems,
        total_amount: newTotal
      };
    });
  };

  return {
    formData,
    setFormData,
    formattedTotal,
    updateFormattedTotal,
    isNewOrder,
    formatCurrency,
    resetForm,
    addItem,
    removeItem,
    updateItem,
    calculateTotalAmount
  };
};
