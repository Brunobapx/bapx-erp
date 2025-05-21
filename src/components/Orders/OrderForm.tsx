
import React, { useEffect } from 'react';
import { useClients } from '@/hooks/useClients';
import { useProducts } from '@/hooks/useProducts';
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
  const { clients = [] } = useClients();
  const { products = [] } = useProducts();
  
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
    console.log("Current form data:", formData);
    console.log("Available clients:", clients);
    console.log("Available products:", products);
  }, [formData, clients, products]);

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
          clients={clients || []}
          openClientCombobox={openClientCombobox}
          setOpenClientCombobox={setOpenClientCombobox}
        />
        
        {/* Product Selection */}
        <OrderProductSection 
          selectedProductId={formData.product_id || ''}
          selectedProductName={formData.product_name || ''}
          onProductSelect={handleProductSelect}
          products={products || []}
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
