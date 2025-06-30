import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useOrderInsert } from '@/hooks/useOrderInsert';
import { useUserProfile } from '@/hooks/useUserProfile';
import { OrderClientSection } from './Form/OrderClientSection';
import { OrderProductSection } from './Form/OrderProductSection';
import { OrderPaymentSection } from './Form/OrderPaymentSection';
import { OrderDeliverySection } from './Form/OrderDeliverySection';
import { OrderFormActions } from './Form/OrderFormActions';
import { toast } from "sonner";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle, Loader2 } from "lucide-react";

interface OrderFormProps {
  orderData?: any;
  onClose: (refresh?: boolean) => void;
}

export const OrderForm: React.FC<OrderFormProps> = ({ orderData, onClose }) => {
  const navigate = useNavigate();
  const { createOrder, isSubmitting, hasValidProfile, profileError } = useOrderInsert();
  const { loading: profileLoading } = useUserProfile();
  
  // State management
  const [formData, setFormData] = useState({
    client_id: '',
    client_name: '',
    seller: '',
    delivery_deadline: '',
    payment_method: '',
    payment_term: '',
    notes: '',
    items: []
  });

  const [openClientCombobox, setOpenClientCombobox] = useState(false);
  const [openProductCombobox, setOpenProductCombobox] = useState(false);

  // useEffect for orderData
  useEffect(() => {
    if (orderData) {
      setFormData({
        client_id: orderData.client_id || '',
        client_name: orderData.client_name || '',
        seller: orderData.seller || '',
        delivery_deadline: orderData.delivery_deadline || '',
        payment_method: orderData.payment_method || '',
        payment_term: orderData.payment_term || '',
        notes: orderData.notes || '',
        items: orderData.items || []
      });
    }
  }, [orderData]);

  // Helper functions
  const updateFormData = (updates: any) => {
    setFormData(prev => ({ ...prev, ...updates }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Verificar se o perfil é válido antes de tentar criar o pedido
    if (!hasValidProfile) {
      toast.error(`Não é possível criar pedido: ${profileError || 'Perfil inválido'}`);
      return;
    }

    if (!formData.client_id || formData.items.length === 0) {
      toast.error('Selecione um cliente e adicione pelo menos um produto');
      return;
    }

    try {
      const orderId = await createOrder(formData);
      onClose(true);
    } catch (error) {
      console.error('Erro ao enviar formulário:', error);
    }
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
    <form onSubmit={handleSubmit} className="space-y-6">
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
          <OrderProductSection
            formData={formData}
            onUpdateFormData={updateFormData}
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
        onClose={() => onClose(false)}
        isSubmitting={isSubmitting}
        hasItems={formData.items.length > 0}
        hasClient={!!formData.client_id}
      />
    </form>
  );
};
