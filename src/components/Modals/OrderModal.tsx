
import React, { useState, useEffect } from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, Check, ChevronsUpDown } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { useClients } from "@/hooks/useClients";
import { useProducts } from "@/hooks/useProducts";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command";

export const OrderModal = ({ isOpen, onClose, orderData }) => {
  // Client and product hooks
  const { clients } = useClients();
  const { products } = useProducts();

  // Form state
  const [formData, setFormData] = useState({
    id: '',
    client_id: '',
    client_name: '',
    product_id: '',
    product_name: '',
    quantity: 1,
    delivery_deadline: null,
    payment_method: '',
    payment_term: '',
    seller: '',
    status: 'Novo Pedido',
  });

  // UI states
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [openClientCombobox, setOpenClientCombobox] = useState(false);
  const [openProductCombobox, setOpenProductCombobox] = useState(false);
  const [openCalendar, setOpenCalendar] = useState(false);

  // Determine if this is a new order
  const isNewOrder = !orderData?.id || orderData.id === 'NOVO';

  // Initialize form with order data if available
  useEffect(() => {
    if (orderData && orderData.id && orderData.id !== 'NOVO') {
      setFormData({
        id: orderData.id || '',
        client_id: orderData.client_id || '',
        client_name: orderData.client_name || '',
        product_id: orderData.product_id || '',
        product_name: orderData.product_name || '',
        quantity: orderData.quantity || 1,
        delivery_deadline: orderData.delivery_deadline ? new Date(orderData.delivery_deadline) : null,
        payment_method: orderData.payment_method || '',
        payment_term: orderData.payment_term || '',
        seller: orderData.seller || '',
        status: orderData.status || 'Novo Pedido',
      });
    } else {
      resetForm();
    }
  }, [orderData]);

  // Reset form to initial values
  const resetForm = () => {
    setFormData({
      id: '',
      client_id: '',
      client_name: '',
      product_id: '',
      product_name: '',
      quantity: 1,
      delivery_deadline: null,
      payment_method: '',
      payment_term: '',
      seller: '',
      status: 'Novo Pedido',
    });
  };

  // Handle input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Handle client selection
  const handleClientSelect = (clientId) => {
    const selectedClient = clients.find(client => client.id === clientId);
    if (selectedClient) {
      setFormData(prev => ({
        ...prev,
        client_id: selectedClient.id,
        client_name: selectedClient.name
      }));
    }
    setOpenClientCombobox(false);
  };

  // Handle product selection
  const handleProductSelect = (productId) => {
    const selectedProduct = products.find(product => product.id === productId);
    if (selectedProduct) {
      setFormData(prev => ({
        ...prev,
        product_id: selectedProduct.id,
        product_name: selectedProduct.name
      }));
    }
    setOpenProductCombobox(false);
  };

  // Handle date selection
  const handleDateSelect = (date) => {
    setFormData(prev => ({
      ...prev,
      delivery_deadline: date
    }));
    setOpenCalendar(false);
  };

  // Form validation
  const validateForm = () => {
    if (!formData.client_name) {
      toast.error("Cliente é obrigatório");
      return false;
    }
    if (!formData.product_name) {
      toast.error("Produto é obrigatório");
      return false;
    }
    if (formData.quantity <= 0) {
      toast.error("Quantidade deve ser maior que zero");
      return false;
    }
    return true;
  };

  // Handle form submission
  const handleSubmit = async () => {
    if (!validateForm()) return;
    
    try {
      setIsSubmitting(true);
      
      const orderPayload = {
        client_id: formData.client_id,
        client_name: formData.client_name,
        product_id: formData.product_id,
        product_name: formData.product_name,
        quantity: formData.quantity,
        delivery_deadline: formData.delivery_deadline,
        payment_method: formData.payment_method,
        payment_term: formData.payment_term,
        seller: formData.seller,
        status: formData.status
      };
      
      if (isNewOrder) {
        const { error } = await supabase.from('orders').insert([orderPayload]);
        if (error) throw error;
        toast.success("Pedido criado com sucesso");
      } else {
        const { error } = await supabase
          .from('orders')
          .update(orderPayload)
          .eq('id', formData.id);
        if (error) throw error;
        toast.success("Pedido atualizado com sucesso");
      }
      
      onClose(true); // Pass true to refresh the orders list
    } catch (error) {
      console.error("Erro ao salvar pedido:", error);
      toast.error(`Erro ao ${isNewOrder ? 'criar' : 'atualizar'} pedido: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={() => onClose()}>
      <DialogContent className="sm:max-w-[550px]">
        <DialogHeader>
          <DialogTitle>{isNewOrder ? 'Novo Pedido' : 'Editar Pedido'}</DialogTitle>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          {/* Client Selection */}
          <div className="grid gap-2">
            <Label htmlFor="client">Cliente *</Label>
            <Popover open={openClientCombobox} onOpenChange={setOpenClientCombobox}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={openClientCombobox}
                  className="justify-between w-full"
                >
                  {formData.client_name || "Selecione um cliente"}
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[400px] p-0">
                <Command>
                  <CommandInput placeholder="Buscar cliente..." />
                  <CommandEmpty>Nenhum cliente encontrado.</CommandEmpty>
                  <CommandGroup>
                    {clients.map((client) => (
                      <CommandItem
                        key={client.id}
                        value={client.id}
                        onSelect={() => handleClientSelect(client.id)}
                      >
                        <Check
                          className={cn(
                            "mr-2 h-4 w-4",
                            formData.client_id === client.id ? "opacity-100" : "opacity-0"
                          )}
                        />
                        {client.name}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </Command>
              </PopoverContent>
            </Popover>
          </div>
          
          {/* Product Selection */}
          <div className="grid gap-2">
            <Label htmlFor="product">Produto *</Label>
            <Popover open={openProductCombobox} onOpenChange={setOpenProductCombobox}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={openProductCombobox}
                  className="justify-between w-full"
                >
                  {formData.product_name || "Selecione um produto"}
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[400px] p-0">
                <Command>
                  <CommandInput placeholder="Buscar produto..." />
                  <CommandEmpty>Nenhum produto encontrado.</CommandEmpty>
                  <CommandGroup>
                    {products.map((product) => (
                      <CommandItem
                        key={product.id}
                        value={product.id}
                        onSelect={() => handleProductSelect(product.id)}
                      >
                        <Check
                          className={cn(
                            "mr-2 h-4 w-4",
                            formData.product_id === product.id ? "opacity-100" : "opacity-0"
                          )}
                        />
                        {product.name}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </Command>
              </PopoverContent>
            </Popover>
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
            <Popover open={openCalendar} onOpenChange={setOpenCalendar}>
              <PopoverTrigger asChild>
                <Button
                  variant={"outline"}
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !formData.delivery_deadline && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {formData.delivery_deadline ? (
                    format(formData.delivery_deadline, "dd/MM/yyyy")
                  ) : (
                    "Selecione uma data"
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={formData.delivery_deadline}
                  onSelect={handleDateSelect}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
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
        
        <DialogFooter>
          <Button 
            type="button" 
            variant="outline" 
            onClick={() => onClose()}
          >
            Cancelar
          </Button>
          <Button 
            type="button" 
            onClick={handleSubmit} 
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Salvando...' : (isNewOrder ? 'Criar Pedido' : 'Salvar Alterações')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
