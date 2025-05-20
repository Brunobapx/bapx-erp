
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { ComboboxSearch } from "@/components/ComboboxSearch";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { CalendarIcon, CreditCard, User } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

interface ApprovalModalProps {
  isOpen: boolean;
  onClose: () => void;
  stage: string;
  orderData?: any;
  clientsData?: { value: string; label: string }[];
  productsData?: { value: string; label: string }[];
}

export const ApprovalModal = ({ 
  isOpen, 
  onClose, 
  stage, 
  orderData,
  clientsData = [],
  productsData = []
}: ApprovalModalProps) => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    id: '',
    customer: '',
    product: '',
    quantity: '',
    notes: '',
    deliveryDate: null as Date | null,
    paymentMethod: '',
    seller: ''
  });
  
  // Dummy payment methods
  const paymentMethods = [
    { value: 'boleto', label: 'Boleto Bancário' },
    { value: 'credit', label: 'Cartão de Crédito' },
    { value: 'debit', label: 'Cartão de Débito' },
    { value: 'pix', label: 'PIX' },
    { value: 'transfer', label: 'Transferência Bancária' },
    { value: 'cash', label: 'Dinheiro' },
  ];
  
  // Dummy sellers
  const sellers = [
    { value: '1', label: 'João Silva' },
    { value: '2', label: 'Maria Oliveira' },
    { value: '3', label: 'Pedro Santos' },
    { value: '4', label: 'Ana Costa' },
  ];
  
  useEffect(() => {
    if (orderData) {
      setFormData({
        id: orderData.id || '',
        customer: orderData.customer || '',
        product: orderData.product || '',
        quantity: orderData.quantity?.toString() || '',
        notes: orderData.notes || '',
        deliveryDate: orderData.deliveryDate ? 
          (typeof orderData.deliveryDate === 'string' ? 
            new Date(orderData.deliveryDate) : orderData.deliveryDate) : null,
        paymentMethod: orderData.paymentMethod || '',
        seller: orderData.seller || ''
      });
    }
  }, [orderData]);
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  
  const handleSelectCustomer = (value: string) => {
    const customer = clientsData.find(client => client.value === value);
    setFormData(prev => ({ ...prev, customer: customer ? customer.label : '' }));
  };
  
  const handleSelectProduct = (value: string) => {
    const product = productsData.find(prod => prod.value === value);
    setFormData(prev => ({ ...prev, product: product ? product.label : '' }));
  };
  
  const handleSelectPaymentMethod = (value: string) => {
    const paymentMethod = paymentMethods.find(method => method.value === value);
    setFormData(prev => ({ ...prev, paymentMethod: paymentMethod ? paymentMethod.label : '' }));
  };
  
  const handleSelectSeller = (value: string) => {
    const seller = sellers.find(s => s.value === value);
    setFormData(prev => ({ ...prev, seller: seller ? seller.label : '' }));
  };
  
  const handleDateSelect = (date: Date | undefined) => {
    setFormData(prev => ({ ...prev, deliveryDate: date || null }));
  };
  
  const handleSubmit = async () => {
    try {
      if (!user?.id) {
        toast({
          title: "Erro",
          description: "Você precisa estar logado para realizar esta ação.",
          variant: "destructive",
        });
        return;
      }

      // Get client and product IDs from their labels
      const clientInfo = clientsData.find(client => client.label === formData.customer);
      const productInfo = productsData.find(product => product.label === formData.product);
      
      const clientId = clientInfo?.value || '0';
      const productId = productInfo?.value || '0';
      
      const isNewOrder = formData.id === 'NOVO';
      
      // Format deliveryDate for database
      const deliveryDeadline = formData.deliveryDate ? 
        formData.deliveryDate.toISOString().split('T')[0] : null;

      if (isNewOrder) {
        // Insert new order
        const { data, error } = await supabase
          .from('orders')
          .insert({
            user_id: user.id,
            client_id: clientId,
            client_name: formData.customer,
            product_id: productId,
            product_name: formData.product,
            quantity: parseInt(formData.quantity) || 1,
            delivery_deadline: deliveryDeadline,
            payment_method: formData.paymentMethod,
            seller: formData.seller,
            status: 'Aguardando Produção'
          })
          .select();

        if (error) {
          throw error;
        }

        toast({
          title: "Pedido criado com sucesso",
          description: `O pedido foi registrado no sistema.`,
        });
      } else {
        // Update existing order
        const { error } = await supabase
          .from('orders')
          .update({
            client_id: clientId,
            client_name: formData.customer,
            product_id: productId,
            product_name: formData.product,
            quantity: parseInt(formData.quantity) || 1,
            delivery_deadline: deliveryDeadline,
            payment_method: formData.paymentMethod,
            seller: formData.seller,
            updated_at: new Date().toISOString()
          })
          .eq('id', formData.id);

        if (error) {
          throw error;
        }

        toast({
          title: "Pedido atualizado com sucesso",
          description: `O pedido ${formData.id} foi atualizado.`,
        });
      }
      
      onClose();
    } catch (error: any) {
      console.error('Error saving order:', error);
      toast({
        title: "Erro ao salvar pedido",
        description: error.message || "Ocorreu um erro ao processar o pedido.",
        variant: "destructive",
      });
    }
  };
  
  const getStageTitle = () => {
    switch (stage) {
      case 'order': return 'Pedido';
      case 'production': return 'Produção';
      case 'packaging': return 'Embalagem';
      case 'sales': return 'Venda';
      case 'finance': return 'Financeiro';
      case 'route': return 'Rota';
      default: return 'Aprovação';
    }
  };
  
  const getStageColor = () => {
    switch (stage) {
      case 'order': return 'bg-erp-order hover:bg-erp-order/90';
      case 'production': return 'bg-erp-production hover:bg-erp-production/90';
      case 'packaging': return 'bg-erp-packaging hover:bg-erp-packaging/90';
      case 'sales': return 'bg-erp-sales hover:bg-erp-sales/90';
      case 'finance': return 'bg-erp-finance hover:bg-erp-finance/90';
      case 'route': return 'bg-erp-route hover:bg-erp-route/90';
      default: return '';
    }
  };
  
  const isNewOrder = orderData?.id === 'NOVO';
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>{isNewOrder ? `Novo ${getStageTitle()}` : `${getStageTitle()} #${orderData?.id}`}</DialogTitle>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="customer">Cliente</Label>
            {clientsData.length > 0 ? (
              <ComboboxSearch
                items={clientsData}
                placeholder="Selecione um cliente"
                emptyText="Nenhum cliente encontrado"
                value={clientsData.find(client => client.label === formData.customer)?.value || ""}
                onChange={handleSelectCustomer}
              />
            ) : (
              <Input
                id="customer"
                name="customer"
                value={formData.customer}
                onChange={handleChange}
              />
            )}
          </div>
          
          <div className="grid gap-2">
            <Label htmlFor="product">Produto</Label>
            {productsData.length > 0 ? (
              <ComboboxSearch
                items={productsData}
                placeholder="Selecione um produto"
                emptyText="Nenhum produto encontrado"
                value={productsData.find(product => product.label === formData.product)?.value || ""}
                onChange={handleSelectProduct}
              />
            ) : (
              <Input
                id="product"
                name="product"
                value={formData.product}
                onChange={handleChange}
              />
            )}
          </div>
          
          <div className="grid gap-2">
            <Label htmlFor="quantity">Quantidade</Label>
            <Input
              id="quantity"
              name="quantity"
              type="number"
              min="1"
              value={formData.quantity}
              onChange={handleChange}
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="deliveryDate">Prazo de Entrega</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant={"outline"}
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !formData.deliveryDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {formData.deliveryDate ? format(formData.deliveryDate, "dd/MM/yyyy") : <span>Selecione a data</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={formData.deliveryDate || undefined}
                  onSelect={handleDateSelect}
                  initialFocus
                  className={cn("p-3 pointer-events-auto")}
                  disabled={(date) => date < new Date()}
                />
              </PopoverContent>
            </Popover>
          </div>
          
          <div className="grid gap-2">
            <Label htmlFor="paymentMethod">Forma de Pagamento</Label>
            <ComboboxSearch
              items={paymentMethods}
              placeholder="Selecione a forma de pagamento"
              emptyText="Nenhuma forma de pagamento encontrada"
              value={paymentMethods.find(method => method.label === formData.paymentMethod)?.value || ""}
              onChange={handleSelectPaymentMethod}
              className="flex items-center"
            />
          </div>
          
          <div className="grid gap-2">
            <Label htmlFor="seller">Vendedor</Label>
            <ComboboxSearch
              items={sellers}
              placeholder="Selecione o vendedor"
              emptyText="Nenhum vendedor encontrado"
              value={sellers.find(seller => seller.label === formData.seller)?.value || ""}
              onChange={handleSelectSeller}
              className="flex items-center"
            />
          </div>
          
          <div className="grid gap-2">
            <Label htmlFor="notes">Observações</Label>
            <Textarea
              id="notes"
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              rows={3}
            />
          </div>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} className={getStageColor()}>
            {isNewOrder ? 'Criar' : 'Atualizar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
