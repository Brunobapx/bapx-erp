
import React from 'react';
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { ClientSelector } from './ClientSelector';
import { ProductSelector } from './ProductSelector';
import { DateSelector } from './DateSelector';
import { useClients } from '@/hooks/useClients';
import { useProducts } from '@/hooks/useProducts';
import { useOrderForm } from '@/hooks/useOrderForm';
import { Order } from '@/hooks/useOrders';

interface OrderFormProps {
  orderData: Order | null;
  onClose: (refresh?: boolean) => void;
}

export const OrderForm: React.FC<OrderFormProps> = ({ orderData, onClose }) => {
  const { clients } = useClients();
  const { products } = useProducts();
  
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
    isNewOrder
  } = useOrderForm({ orderData, onClose });

  return (
    <div className="grid gap-4 py-4">
      {/* Client Selection */}
      <div className="grid gap-2">
        <Label htmlFor="client">Cliente *</Label>
        <ClientSelector 
          clients={clients}
          selectedClientId={formData.client_id}
          selectedClientName={formData.client_name}
          onClientSelect={handleClientSelect}
          open={openClientCombobox}
          setOpen={setOpenClientCombobox}
        />
      </div>
      
      {/* Product Selection */}
      <div className="grid gap-2">
        <Label htmlFor="product">Produto *</Label>
        <ProductSelector 
          products={products}
          selectedProductId={formData.product_id}
          selectedProductName={formData.product_name}
          onProductSelect={handleProductSelect}
          open={openProductCombobox}
          setOpen={setOpenProductCombobox}
        />
      </div>
      
      {/* Quantity */}
      <div className="grid gap-2">
        <Label htmlFor="quantity">Quantidade *</Label>
        <Input 
          id="quantity"
          name="quantity"
          type="number"
          min="1"
          value={formData.quantity}
          onChange={handleChange}
          required
        />
      </div>
      
      {/* Delivery Date */}
      <div className="grid gap-2">
        <Label htmlFor="delivery_deadline">Data de Entrega</Label>
        <DateSelector 
          selectedDate={formData.delivery_deadline}
          onDateSelect={handleDateSelect}
          open={openCalendar}
          setOpen={setOpenCalendar}
        />
      </div>
      
      {/* Payment Method */}
      <div className="grid gap-2">
        <Label htmlFor="payment_method">Forma de Pagamento</Label>
        <Input 
          id="payment_method"
          name="payment_method"
          value={formData.payment_method}
          onChange={handleChange}
          placeholder="Ex: Dinheiro, Cartão, Boleto..."
        />
      </div>
      
      {/* Payment Terms */}
      <div className="grid gap-2">
        <Label htmlFor="payment_term">Prazo de Pagamento</Label>
        <Input 
          id="payment_term"
          name="payment_term"
          value={formData.payment_term}
          onChange={handleChange}
          placeholder="Ex: À vista, 30 dias, 60 dias..."
        />
      </div>
      
      {/* Seller */}
      <div className="grid gap-2">
        <Label htmlFor="seller">Vendedor</Label>
        <Input 
          id="seller"
          name="seller"
          value={formData.seller}
          onChange={handleChange}
          placeholder="Nome do vendedor"
        />
      </div>
    </div>
  );
};
