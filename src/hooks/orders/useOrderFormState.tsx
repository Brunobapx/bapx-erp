
import { useState, useEffect } from 'react';
import { Order } from '@/hooks/useOrders';
import { useProducts } from '@/hooks/useProducts';
import { useAuth } from '@/components/Auth/AuthProvider';

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
  salesperson_id: string;
  status: string;
  notes: string;
  total_amount: number;
}

interface UseOrderFormStateProps {
  orderData?: any;
}

export const useOrderFormState = (orderData?: any) => {
  const { products } = useProducts();
  const { user, userRole } = useAuth();
  const [formData, setFormData] = useState<OrderFormState>({
    id: '',
    order_number: '',
    client_id: '',
    client_name: '',
    items: [],
    delivery_deadline: null,
    payment_method: '',
    payment_term: '',
    seller: userRole === 'seller' ? user?.email || '' : '',
    salesperson_id: userRole === 'seller' ? user?.id || '' : '',
    status: 'pending',
    notes: '',
    total_amount: 0,
  });
  
  const [formattedTotal, setFormattedTotal] = useState('R$ 0,00');
  
  const isNewOrder = !orderData?.id || orderData.id === 'NOVO';

  const initializeFormData = (data: any) => {
    if (data && data.id && data.id !== 'NOVO') {
      const items: OrderFormItem[] = data.order_items?.map((item: any) => ({
        id: item.id,
        product_id: item.product_id,
        product_name: item.product_name,
        quantity: item.quantity,
        unit_price: item.unit_price,
        total_price: item.total_price,
      })) || [];
      
      setFormData({
        id: data.id?.toString() || '',
        order_number: data.order_number || '',
        client_id: data.client_id || '',
        client_name: data.client_name || '',
        items,
        delivery_deadline: data.delivery_deadline ? new Date(data.delivery_deadline) : null,
        payment_method: data.payment_method || '',
        payment_term: data.payment_term || '',
        seller: data.seller || '',
        salesperson_id: data.salesperson_id || '',
        status: data.status || 'pending',
        notes: data.notes || '',
        total_amount: data.total_amount || 0,
      });
      
      updateFormattedTotal(data.total_amount);
    } else {
      resetForm();
    }
  };

  useEffect(() => {
    if (orderData) {
      initializeFormData(orderData);
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
      seller: userRole === 'seller' ? user?.email || '' : '',
      salesperson_id: userRole === 'seller' ? user?.id || '' : '',
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

  const updateFormData = (updates: Partial<OrderFormState>) => {
    setFormData(prev => ({ ...prev, ...updates }));
  };

  const addItem = () => {
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
    setFormData(prev => {
      const newItems = prev.items.map(item => {
        if (item.id === itemId) {
          const updatedItem = { ...item, ...updates };
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
    items: formData.items,
    totalAmount: formData.total_amount,
    formattedTotal,
    updateFormattedTotal,
    updateFormData,
    initializeFormData,
    isNewOrder,
    formatCurrency,
    resetForm,
    addItem,
    removeItem,
    updateItem,
    calculateTotalAmount
  };
};
