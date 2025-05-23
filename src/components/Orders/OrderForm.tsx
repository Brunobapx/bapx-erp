
import React, { useEffect } from 'react';
import { useClients } from '@/hooks/useClients';
import { useOrderForm } from '@/hooks/useOrderForm';
import { Order } from '@/hooks/useOrders';
import { OrderClientSection } from './Form/OrderClientSection';
import { OrderProductSection } from './Form/OrderProductSection';
import { OrderQuantityPriceSection } from './Form/OrderQuantityPriceSection';
import { OrderDeliverySection } from './Form/OrderDeliverySection';
import { OrderPaymentSection } from './Form/OrderPaymentSection';
import { OrderFormActions } from './Form/OrderFormActions';

interface OrderFormProps {
  orderData: Order | null;
  onClose: (refresh?: boolean) => void;
}

export const OrderForm: React.FC<OrderFormProps> = ({ orderData, onClose }) => {
  const { clients, loading: clientsLoading, error: clientsError, refreshClients } = useClients();
  
  const {
    formData,
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
    isSubmitting,
    isNewOrder,
    calculateTotal,
    formattedTotal
  } = useOrderForm({ orderData, onClose });

  // Debug logging
  useEffect(() => {
    console.log("OrderForm - Debug info:", {
      formData,
      clientsCount: clients?.length || 0,
      clientsLoading,
      clientsError
    });
  }, [formData, clients, clientsLoading, clientsError]);

  // Auto-refresh clients if there's an error or if no clients are loaded
  useEffect(() => {
    if (clientsError || (!clientsLoading && (!clients || clients.length === 0))) {
      console.log('OrderForm - Tentando recarregar clientes...');
      refreshClients();
    }
  }, [clientsError, clientsLoading, clients, refreshClients]);

  // Handler for select changes
  const handleSelectChange = (name: string, value: string) => {
    handleChange({
      target: { name, value }
    } as React.ChangeEvent<HTMLInputElement>);
  };

  return (
    <form onSubmit={(e) => { e.preventDefault(); handleSubmit(); }} className="space-y-6 bg-white p-6 rounded-lg shadow">
      <div className="grid gap-6">
        {/* Client Selection */}
        <OrderClientSection 
          selectedClientId={formData.client_id || ''}
          selectedClientName={formData.client_name || ''}
          onClientSelect={handleClientSelect}
          openClientCombobox={openClientCombobox}
          setOpenClientCombobox={setOpenClientCombobox}
        />
        
        {/* Product Selection */}
        <OrderProductSection 
          selectedProductId={formData.product_id || ''}
          selectedProductName={formData.product_name || ''}
          onProductSelect={handleProductSelect}
          openProductCombobox={openProductCombobox}
          setOpenProductCombobox={setOpenProductCombobox}
        />
        
        {/* Quantity and Price */}
        <OrderQuantityPriceSection 
          quantity={formData.quantity || 1}
          unitPrice={formData.unit_price || ''}
          onChange={handleChange}
          onBlur={calculateTotal}
          formattedTotal={formattedTotal}
        />
        
        {/* Delivery Date */}
        <OrderDeliverySection 
          selectedDate={formData.delivery_deadline}
          onDateSelect={handleDateSelect}
          openCalendar={openCalendar}
          setOpenCalendar={setOpenCalendar}
        />
        
        {/* Payment Details */}
        <OrderPaymentSection 
          paymentMethod={formData.payment_method || ''}
          paymentTerm={formData.payment_term || ''}
          seller={formData.seller || ''}
          onChange={handleChange}
          onSelectChange={handleSelectChange}
        />
      </div>

      {/* Form Actions */}
      <OrderFormActions 
        onCancel={() => onClose()}
        isSubmitting={isSubmitting}
        isNewOrder={isNewOrder}
      />
    </form>
  );
};
