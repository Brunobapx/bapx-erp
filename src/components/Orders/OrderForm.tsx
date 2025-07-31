
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import { OrderClientSection } from './Form/OrderClientSection';
import { OrderItemsSection } from './Form/OrderItemsSection';
import { OrderPaymentSection } from './Form/OrderPaymentSection';
import { OrderDeliverySection } from './Form/OrderDeliverySection';
import { OrderFormActions } from './Form/OrderFormActions';
import { useOrderForm } from '@/hooks/useOrderForm';

interface OrderFormProps {
  orderData?: any;
  onClose: (refresh?: boolean) => void;
}

export const OrderForm: React.FC<OrderFormProps> = ({ orderData, onClose }) => {
  
  // Use the comprehensive order form hook
  const {
    formData,
    items,
    totalAmount,
    isSubmitting,
    openClientCombobox,
    setOpenClientCombobox,
    openProductCombobox,
    setOpenProductCombobox,
    addItem,
    removeItem,
    updateItem,
    updateFormData,
    handleSubmit,
    validateForm
  } = useOrderForm({ orderData, onClose });

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Usar a validação e submissão do hook
    await handleSubmit();
  };

  return (
    <form onSubmit={handleFormSubmit} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Informações do Cliente</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <OrderClientSection
            formData={formData}
            onUpdateFormData={updateFormData}
            openClientCombobox={openClientCombobox}
            setOpenClientCombobox={setOpenClientCombobox}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Produtos</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <OrderItemsSection
            items={items}
            onAddItem={addItem}
            onRemoveItem={removeItem}
            onUpdateItem={updateItem}
            openProductCombobox={openProductCombobox}
            setOpenProductCombobox={setOpenProductCombobox}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Pagamento</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <OrderPaymentSection
            formData={formData}
            onUpdateFormData={updateFormData}
            totalAmount={totalAmount}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Entrega</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <OrderDeliverySection
            formData={formData}
            onUpdateFormData={updateFormData}
          />
        </CardContent>
      </Card>

      <OrderFormActions
        onCancel={() => onClose(false)}
        isSubmitting={isSubmitting}
        isEditing={!!orderData?.id}
      />
    </form>
  );
};
