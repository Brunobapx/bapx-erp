
import React, { useEffect } from 'react';
import { useClients } from '@/hooks/useClients';
import { useOrderForm } from '@/hooks/useOrderForm';
import { Order } from '@/hooks/useOrders';
import { OrderClientSection } from './Form/OrderClientSection';
import { OrderItemsSection } from './Form/OrderItemsSection';
import { OrderDeliverySection } from './Form/OrderDeliverySection';
import { OrderPaymentSection } from './Form/OrderPaymentSection';
import { OrderFormActions } from './Form/OrderFormActions';
import { Label } from "@/components/ui/label";

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
    openCalendar,
    setOpenCalendar,
    handleChange,
    handleClientSelect,
    handleDateSelect,
    handleSubmit,
    isSubmitting,
    isNewOrder,
    formattedTotal,
    addItem,
    removeItem,
    updateItem
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

  // Automatically add first item for new orders
  useEffect(() => {
    if (isNewOrder && formData.items.length === 0) {
      addItem();
    }
  }, [isNewOrder, formData.items.length, addItem]);

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
          clients={clients}
          openClientCombobox={openClientCombobox}
          setOpenClientCombobox={setOpenClientCombobox}
          loading={clientsLoading}
          error={clientsError}
        />
        
        {/* Items Section */}
        <OrderItemsSection
          items={formData.items}
          onAddItem={addItem}
          onRemoveItem={removeItem}
          onUpdateItem={updateItem}
        />
        
        {/* Total */}
        <div className="grid gap-1">
          <Label>Valor Total do Pedido</Label>
          <div className="text-xl font-bold p-3 border rounded bg-gray-50 text-green-700">
            {formattedTotal}
          </div>
        </div>
        
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
