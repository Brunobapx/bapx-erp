
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useOrderInsert } from '@/hooks/useOrderInsert';
import { useUserProfile } from '@/hooks/useUserProfile';
import { OrderClientSection } from './Form/OrderClientSection';
import { OrderItemsSection } from './Form/OrderItemsSection';
import { OrderPaymentSection } from './Form/OrderPaymentSection';
import { OrderDeliverySection } from './Form/OrderDeliverySection';
import { OrderFormActions } from './Form/OrderFormActions';
import { useOrderForm } from '@/hooks/useOrderForm';
import { toast } from "sonner";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle, Loader2 } from "lucide-react";

interface OrderFormProps {
  orderData?: any;
  onClose: (refresh?: boolean) => void;
}

export const OrderForm: React.FC<OrderFormProps> = ({ orderData, onClose }) => {
  const navigate = useNavigate();
  const { hasValidProfile, error: profileError, loading: profileLoading } = useUserProfile();
  
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
    
    // Verificar se o perfil é válido antes de tentar criar o pedido
    if (!hasValidProfile) {
      toast.error(`Não é possível criar pedido: ${profileError || 'Perfil inválido'}`);
      return;
    }

    // Usar a validação e submissão do hook
    await handleSubmit();
  };

  // Mostrar loading enquanto verifica perfil
  if (profileLoading) {
    return (
      <Card className="w-full max-w-4xl mx-auto">
        <CardContent className="p-6">
          <div className="flex items-center justify-center space-x-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>Verificando permissões...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Mostrar erro se perfil inválido
  if (!hasValidProfile) {
    return (
      <Card className="w-full max-w-4xl mx-auto">
        <CardContent className="p-6">
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <strong>Não é possível criar pedidos:</strong> {profileError}
              <br />
              <br />
              Entre em contato com o administrador do sistema para resolver este problema.
            </AlertDescription>
          </Alert>
          <div className="mt-4">
            <Button variant="outline" onClick={() => onClose(false)}>
              Voltar
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

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
