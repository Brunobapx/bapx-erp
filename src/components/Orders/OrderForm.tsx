
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useOrderFormState } from '@/hooks/orders/useOrderFormState';
import { useOrderFormActions } from '@/hooks/orders/useOrderFormActions';
import { useOrderFormUI } from '@/hooks/orders/useOrderFormUI';
import { OrderClientSection } from './Form/OrderClientSection';
import { OrderItemsSection } from './Form/OrderItemsSection';
import { OrderPaymentSection } from './Form/OrderPaymentSection';
import { OrderDeliverySection } from './Form/OrderDeliverySection';
import { OrderFormActions } from './Form/OrderFormActions';
import { useOrders } from '@/hooks/useOrders';

interface OrderFormProps {
  orderData?: any;
  onClose: (refresh?: boolean) => void;
}

export const OrderForm: React.FC<OrderFormProps> = ({ orderData, onClose }) => {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { checkStockAndSendToProduction } = useOrders();
  
  const {
    formData,
    items,
    totalAmount,
    setFormData,
    updateFormData,
    addItem,
    removeItem,
    updateItem,
    initializeFormData,
    updateFormattedTotal,
    isNewOrder
  } = useOrderFormState(orderData);

  const {
    handleSubmit: handleFormSubmit,
    validateForm,
    handleChange,
    handleClientSelect,
    handleDateSelect
  } = useOrderFormActions({
    formData,
    setFormData,
    updateFormattedTotal,
    isNewOrder,
    onClose,
    items
  });

  const {
    openClientCombobox,
    setOpenClientCombobox,
    openProductCombobox,
    setOpenProductCombobox
  } = useOrderFormUI();

  useEffect(() => {
    if (orderData) {
      initializeFormData(orderData);
    }
  }, [orderData, initializeFormData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    setIsSubmitting(true);
    try {
      const orderId = await handleFormSubmit();
      
      if (orderId) {
        // Se é um novo pedido (não edição), verificar estoque automaticamente
        if (!orderData) {
          console.log('Novo pedido criado, verificando estoque automaticamente...');
          await checkStockAndSendToProduction(orderId);
        }
        
        onClose(true);
      }
    } catch (error) {
      console.error('Erro ao processar pedido:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    onClose(false);
  };

  const isEditing = !!orderData;

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle>{isEditing ? 'Editar Pedido' : 'Novo Pedido'}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <OrderClientSection
            formData={formData}
            onUpdateFormData={updateFormData}
            openClientCombobox={openClientCombobox}
            setOpenClientCombobox={setOpenClientCombobox}
          />

          <Separator />

          <OrderItemsSection
            items={items}
            onAddItem={addItem}
            onRemoveItem={removeItem}
            onUpdateItem={updateItem}
            openProductCombobox={openProductCombobox}
            setOpenProductCombobox={setOpenProductCombobox}
          />

          <Separator />

          <OrderPaymentSection
            formData={formData}
            onUpdateFormData={updateFormData}
            totalAmount={totalAmount}
          />

          <Separator />

          <OrderDeliverySection
            formData={formData}
            onUpdateFormData={updateFormData}
          />

          <OrderFormActions
            onCancel={handleCancel}
            isSubmitting={isSubmitting}
            isEditing={isEditing}
          />
        </form>
      </CardContent>
    </Card>
  );
};
