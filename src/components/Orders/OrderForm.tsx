
import React, { useEffect } from 'react';
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  const { clients, loading: loadingClients } = useClients();
  const { products, loading: loadingProducts } = useProducts();
  
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
    console.log("Available clients:", clients.length);
    console.log("Available products:", products.length);
  }, [formData, clients, products]);

  return (
    <form onSubmit={(e) => { e.preventDefault(); handleSubmit(); }} className="space-y-6">
      <div className="grid gap-6">
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
          {loadingClients && <p className="text-sm text-muted-foreground">Carregando clientes...</p>}
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
          {loadingProducts && <p className="text-sm text-muted-foreground">Carregando produtos...</p>}
        </div>
        
        <div className="grid sm:grid-cols-2 gap-4">
          {/* Quantity */}
          <div className="grid gap-2">
            <Label htmlFor="quantity">Quantidade *</Label>
            <Input 
              id="quantity"
              name="quantity"
              type="number"
              min="1"
              value={formData.quantity || 1}
              onChange={handleChange}
              required
              onBlur={calculateTotal}
            />
          </div>
          
          {/* Unit Price */}
          <div className="grid gap-2">
            <Label htmlFor="unit_price">Preço Unitário</Label>
            <Input 
              id="unit_price"
              name="unit_price"
              type="number"
              step="0.01"
              value={formData.unit_price || ''}
              onChange={handleChange}
              onBlur={calculateTotal}
            />
          </div>
        </div>

        {/* Total Value */}
        <div className="grid gap-1">
          <Label>Valor Total</Label>
          <div className="text-lg font-medium">{formattedTotal}</div>
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
          <Select 
            name="payment_method"
            value={formData.payment_method || ''}
            onValueChange={(value) => handleChange({
              target: { name: 'payment_method', value }
            } as React.ChangeEvent<HTMLInputElement>)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecione a forma de pagamento" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Dinheiro">Dinheiro</SelectItem>
              <SelectItem value="Cartão de Crédito">Cartão de Crédito</SelectItem>
              <SelectItem value="Cartão de Débito">Cartão de Débito</SelectItem>
              <SelectItem value="PIX">PIX</SelectItem>
              <SelectItem value="Boleto">Boleto</SelectItem>
              <SelectItem value="Transferência">Transferência</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        {/* Payment Terms */}
        <div className="grid gap-2">
          <Label htmlFor="payment_term">Prazo de Pagamento</Label>
          <Select 
            name="payment_term"
            value={formData.payment_term || ''}
            onValueChange={(value) => handleChange({
              target: { name: 'payment_term', value }
            } as React.ChangeEvent<HTMLInputElement>)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecione o prazo de pagamento" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="À vista">À vista</SelectItem>
              <SelectItem value="7 dias">7 dias</SelectItem>
              <SelectItem value="15 dias">15 dias</SelectItem>
              <SelectItem value="30 dias">30 dias</SelectItem>
              <SelectItem value="45 dias">45 dias</SelectItem>
              <SelectItem value="60 dias">60 dias</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        {/* Seller */}
        <div className="grid gap-2">
          <Label htmlFor="seller">Vendedor</Label>
          <Input 
            id="seller"
            name="seller"
            value={formData.seller || ''}
            onChange={handleChange}
            placeholder="Nome do vendedor"
          />
        </div>
      </div>

      {/* Submit button */}
      <div className="flex justify-end gap-4">
        <Button 
          type="button" 
          variant="outline"
          onClick={() => onClose()}
        >
          Cancelar
        </Button>
        <Button 
          type="submit" 
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Salvando...' : (isNewOrder ? 'Criar Pedido' : 'Salvar Alterações')}
        </Button>
      </div>
    </form>
  );
};
