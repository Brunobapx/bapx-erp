
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";
import { ComboboxSearch } from "@/components/ComboboxSearch";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { CalendarIcon, CreditCard, User } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";

interface ApprovalModalProps {
  isOpen: boolean;
  onClose: () => void;
  stage: string;
  orderData?: any;
  clientsData?: { value: string; label: string }[];
  productsData?: { value: string; label: string }[];
  onSave?: (formData: any) => void;
}

export const ApprovalModal = ({ 
  isOpen, 
  onClose, 
  stage, 
  orderData,
  clientsData = [],
  productsData = [],
  onSave
}: ApprovalModalProps) => {
  const [formData, setFormData] = useState({
    id: '',
    customer: '',
    product: '',
    quantity: '',
    notes: '',
    deliveryDate: null as Date | null,
    paymentMethod: '',
    seller: '',
    status: ''
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

  // Status options based on stage
  const getStatusOptions = () => {
    switch (stage) {
      case 'order':
        return [
          { value: 'aguardando_producao', label: 'Aguardando Produção' },
          { value: 'aguardando_venda', label: 'Aguardando Venda' },
        ];
      case 'production':
        return [
          { value: 'em_producao', label: 'Em Produção' },
          { value: 'aguardando_embalagem', label: 'Aguardando Embalagem' },
        ];
      case 'packaging':
        return [
          { value: 'embalado', label: 'Embalado' },
          { value: 'aguardando_venda', label: 'Aguardando Venda' },
        ];
      case 'sales':
        return [
          { value: 'venda_confirmada', label: 'Venda Confirmada' },
          { value: 'financeiro_pendente', label: 'Financeiro Pendente' },
        ];
      case 'finance':
        return [
          { value: 'financeiro_confirmado', label: 'Financeiro Confirmado' },
          { value: 'aguardando_rota', label: 'Aguardando Rota' },
        ];
      case 'route':
        return [
          { value: 'rota_definida', label: 'Rota Definida' },
          { value: 'entregue', label: 'Entregue' },
        ];
      default:
        return [];
    }
  };
  
  useEffect(() => {
    if (orderData) {
      setFormData({
        id: orderData.id || '',
        customer: orderData.client_name || orderData.customer || '',
        product: orderData.product_name || orderData.product || '',
        quantity: orderData.quantity?.toString() || '',
        notes: orderData.notes || '',
        deliveryDate: orderData.delivery_deadline ? new Date(orderData.delivery_deadline) : null,
        paymentMethod: orderData.payment_method || '',
        seller: orderData.seller || '',
        status: orderData.status || ''
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

  const handleSelectStatus = (value: string) => {
    const status = getStatusOptions().find(option => option.value === value);
    setFormData(prev => ({ ...prev, status: status ? status.label : '' }));
  };
  
  const handleDateSelect = (date: Date | undefined) => {
    setFormData(prev => ({ ...prev, deliveryDate: date || null }));
  };
  
  const handleSubmit = async () => {
    try {
      if (onSave) {
        await onSave(formData);
      } else {
        // Default behavior based on stage
        switch (stage) {
          case 'production':
            await handleProductionUpdate();
            break;
          case 'packaging':
            await handlePackagingUpdate();
            break;
          case 'sales':
            await handleSalesUpdate();
            break;
          case 'finance':
            await handleFinanceUpdate();
            break;
          case 'route':
            await handleRouteUpdate();
            break;
          default:
            // For order stage or any other undefined stage
            await handleOrderUpdate();
        }
      }
      
      onClose();
    } catch (error) {
      console.error(`Error in ${stage} update:`, error);
      toast({
        title: `Erro ao processar ${getStageTitle()}`,
        description: error instanceof Error ? error.message : `Ocorreu um erro ao processar o ${getStageTitle()}.`,
        variant: "destructive",
      });
    }
  };
  
  const handleOrderUpdate = async () => {
    // This is handled by the onSave prop from OrdersPage
    toast({
      title: "Pedido salvo com sucesso",
      description: `Pedido ${formData.id} foi processado.`,
    });
  };

  const handleProductionUpdate = async () => {
    const { error } = await supabase
      .from('orders')
      .update({ status: 'Aguardando Embalagem' })
      .eq('id', formData.id);
    
    if (error) throw error;
    
    toast({
      title: "Produção concluída",
      description: `Pedido ${formData.id} enviado para embalagem.`,
    });
  };

  const handlePackagingUpdate = async () => {
    const { error } = await supabase
      .from('orders')
      .update({ status: 'Aguardando Venda' })
      .eq('id', formData.id);
    
    if (error) throw error;
    
    toast({
      title: "Embalagem concluída",
      description: `Pedido ${formData.id} liberado para venda.`,
    });
  };

  const handleSalesUpdate = async () => {
    const { error } = await supabase
      .from('orders')
      .update({ status: 'Financeiro Pendente' })
      .eq('id', formData.id);
    
    if (error) throw error;
    
    // Get the current user ID
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Usuário não autenticado");
    
    // Create financial transaction
    const { error: financeError } = await supabase
      .from('finance_transactions')
      .insert({
        transaction_type: 'RECEITA',
        amount: parseFloat(formData.quantity) * 100, // Example price calculation
        reference_id: formData.id,
        description: `Venda do produto ${formData.product} para ${formData.customer}`,
        payment_status: 'pending',
        user_id: user.id // Add the required user_id
      });
    
    if (financeError) throw financeError;
    
    toast({
      title: "Venda confirmada",
      description: `Pedido ${formData.id} enviado para financeiro.`,
    });
  };

  const handleFinanceUpdate = async () => {
    const { error } = await supabase
      .from('orders')
      .update({ status: 'Aguardando Rota' })
      .eq('id', formData.id);
    
    if (error) throw error;
    
    // Update financial transaction
    const { error: financeError } = await supabase
      .from('finance_transactions')
      .update({ payment_status: 'completed' })
      .eq('reference_id', formData.id);
    
    if (financeError) throw financeError;
    
    toast({
      title: "Financeiro confirmado",
      description: `Pedido ${formData.id} liberado para roteirização.`,
    });
  };

  const handleRouteUpdate = async () => {
    const { error } = await supabase
      .from('orders')
      .update({ status: 'Completed' })
      .eq('id', formData.id);
    
    if (error) throw error;
    
    toast({
      title: "Rota definida",
      description: `Pedido ${formData.id} finalizado.`,
    });
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
                disabled={stage !== 'order' || !isNewOrder}
              />
            ) : (
              <Input
                id="customer"
                name="customer"
                value={formData.customer}
                onChange={handleChange}
                disabled={stage !== 'order' || !isNewOrder}
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
                disabled={stage !== 'order' || !isNewOrder}
              />
            ) : (
              <Input
                id="product"
                name="product"
                value={formData.product}
                onChange={handleChange}
                disabled={stage !== 'order' || !isNewOrder}
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
              disabled={stage !== 'order' || !isNewOrder}
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
                  disabled={stage !== 'order'}
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
          
          {stage === 'order' && (
            <>
              <div className="grid gap-2">
                <Label htmlFor="paymentMethod">Forma de Pagamento</Label>
                <ComboboxSearch
                  items={paymentMethods}
                  placeholder="Selecione a forma de pagamento"
                  emptyText="Nenhuma forma de pagamento encontrada"
                  value={paymentMethods.find(method => method.label === formData.paymentMethod)?.value || ""}
                  onChange={handleSelectPaymentMethod}
                  className="flex items-center"
                  disabled={!isNewOrder}
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
                  disabled={!isNewOrder}
                />
              </div>
            </>
          )}
          
          {stage !== 'order' && (
            <div className="grid gap-2">
              <Label htmlFor="status">Alterar Status</Label>
              <ComboboxSearch
                items={getStatusOptions()}
                placeholder={`Selecione o status para ${getStageTitle()}`}
                emptyText="Nenhum status disponível"
                value={getStatusOptions().find(option => option.label === formData.status)?.value || ""}
                onChange={handleSelectStatus}
              />
            </div>
          )}
          
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
