
import { Order } from '@/hooks/useOrders';
import { useOrderFormState } from './orders/useOrderFormState';
import { useOrderFormActions } from './orders/useOrderFormActions';
import { useOrderFormUI } from './orders/useOrderFormUI';

interface UseOrderFormProps {
  orderData: Order | null;
  onClose: (refresh?: boolean) => void;
}

export const useOrderForm = ({ orderData, onClose }: UseOrderFormProps) => {
  // Use the specialized hooks
  const { 
    formData, 
    setFormData, 
    formattedTotal, 
    updateFormattedTotal, 
    isNewOrder,
    addItem,
    removeItem,
    updateItem,
    items,
    totalAmount,
    updateFormData,
    initializeFormData,
    calculateTotalAmount
  } = useOrderFormState(orderData);
  
  const {
    openClientCombobox,
    setOpenClientCombobox,
    openProductCombobox,
    setOpenProductCombobox,
    openCalendar,
    setOpenCalendar
  } = useOrderFormUI();
  
  const {
    isSubmitting,
    handleChange,
    handleClientSelect,
    handleDateSelect,
    handleSubmit,
    validateForm
  } = useOrderFormActions({
    formData,
    setFormData,
    updateFormattedTotal,
    isNewOrder,
    onClose,
    items
  });

  // Return all the necessary values and functions
  return {
    // Form state
    formData,
    isNewOrder,
    isSubmitting,
    formattedTotal,
    items,
    totalAmount,
    
    // UI state
    openClientCombobox,
    setOpenClientCombobox,
    openProductCombobox,
    setOpenProductCombobox,
    openCalendar,
    setOpenCalendar,
    
    // Form actions
    handleChange,
    handleClientSelect,
    handleDateSelect,
    handleSubmit,
    validateForm,
    
    // Item management
    addItem,
    removeItem,
    updateItem,
    updateFormData,
    initializeFormData,
    calculateTotalAmount
  };
};
