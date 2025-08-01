import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Order } from '@/hooks/useOrders';
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { DateSelector } from "../Orders/DateSelector";
import { ClientSelector } from "../Orders/ClientSelector";
import { ProductSelector } from "../Orders/ProductSelector";
import { useClients } from '@/hooks/useClients';
import { useProducts } from '@/hooks/useProducts';
import { usePaymentMethods } from '@/hooks/usePaymentMethods';
import { usePaymentTerms } from '@/hooks/usePaymentTerms';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Trash2 } from 'lucide-react';

interface EditOrderModalProps {
  isOpen: boolean;
  onClose: (refresh?: boolean) => void;
  orderData: Order | null;
}

interface OrderItem {
  id?: string;
  product_id: string;
  product_name: string;
  quantity: number;
  unit_price: number;
  total_price: number;
}

export const EditOrderModal: React.FC<EditOrderModalProps> = ({
  isOpen,
  onClose,
  orderData
}) => {
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [openClientCombobox, setOpenClientCombobox] = useState(false);
  const [openCalendar, setOpenCalendar] = useState(false);
  const [openProductCombobox, setOpenProductCombobox] = useState<Record<number, boolean>>({});
  
  const { clients } = useClients();
  const { products } = useProducts();
  const { items: paymentMethods } = usePaymentMethods();
  const { items: paymentTerms } = usePaymentTerms();

  const [formData, setFormData] = useState({
    client_id: '',
    client_name: '',
    delivery_deadline: null as Date | null,
    payment_method: '',
    payment_term: '',
    notes: '',
    seller_name: ''
  });

  const [items, setItems] = useState<OrderItem[]>([]);

  useEffect(() => {
    if (orderData) {
      setFormData({
        client_id: orderData.client_id || '',
        client_name: orderData.client_name || '',
        delivery_deadline: orderData.delivery_deadline ? new Date(orderData.delivery_deadline) : null,
        payment_method: orderData.payment_method || '',
        payment_term: orderData.payment_term || '',
        notes: orderData.notes || '',
        seller_name: orderData.seller_name || ''
      });

      // Carregar itens do pedido
      if (orderData.order_items) {
        setItems(orderData.order_items.map(item => ({
          id: item.id,
          product_id: item.product_id,
          product_name: item.product_name,
          quantity: item.quantity,
          unit_price: item.unit_price,
          total_price: item.total_price
        })));
      }
    }
  }, [orderData]);

  const setOpenProductComboboxForItem = (itemIndex: number, open: boolean) => {
    setOpenProductCombobox(prev => ({
      ...prev,
      [itemIndex]: open
    }));
  };

  const handleClientSelect = (clientId: string, clientName: string) => {
    setFormData(prev => ({
      ...prev,
      client_id: clientId,
      client_name: clientName
    }));
    setOpenClientCombobox(false);
  };

  const handleDateSelect = (date: Date | null) => {
    setFormData(prev => ({
      ...prev,
      delivery_deadline: date
    }));
    setOpenCalendar(false);
  };

  const handleProductSelect = (index: number, productId: string, productName: string, price: number) => {
    const updatedItems = [...items];
    updatedItems[index] = {
      ...updatedItems[index],
      product_id: productId,
      product_name: productName,
      unit_price: price,
      total_price: updatedItems[index].quantity * price
    };
    setItems(updatedItems);
    setOpenProductComboboxForItem(index, false);
  };

  const updateItem = (index: number, field: keyof OrderItem, value: any) => {
    const updatedItems = [...items];
    updatedItems[index] = { ...updatedItems[index], [field]: value };
    
    // Recalcular total se quantidade ou preço mudaram
    if (field === 'quantity' || field === 'unit_price') {
      updatedItems[index].total_price = updatedItems[index].quantity * updatedItems[index].unit_price;
    }
    
    setItems(updatedItems);
  };

  const addItem = () => {
    setItems(prev => [...prev, {
      product_id: '',
      product_name: '',
      quantity: 1,
      unit_price: 0,
      total_price: 0
    }]);
  };

  const removeItem = (index: number) => {
    setItems(prev => prev.filter((_, i) => i !== index));
  };

  const calculateTotal = () => {
    return items.reduce((sum, item) => sum + item.total_price, 0);
  };

  const handleSave = async () => {
    if (!orderData?.id) return;

    try {
      setSaving(true);

      // Atualizar dados do pedido
      const { error: orderError } = await supabase
        .from('orders')
        .update({
          client_id: formData.client_id,
          delivery_deadline: formData.delivery_deadline?.toISOString(),
          payment_method: formData.payment_method,
          payment_term: formData.payment_term,
          notes: formData.notes,
          total_amount: calculateTotal(),
          updated_at: new Date().toISOString()
        })
        .eq('id', orderData.id);

      if (orderError) throw orderError;

      // Remover itens existentes
      const { error: deleteError } = await supabase
        .from('order_items')
        .delete()
        .eq('order_id', orderData.id);

      if (deleteError) throw deleteError;

      // Inserir novos itens
      if (items.length > 0) {
        const itemsToInsert = items.map(item => ({
          order_id: orderData.id,
          product_id: item.product_id,
          product_name: item.product_name,
          quantity: item.quantity,
          unit_price: item.unit_price,
          total_price: item.total_price
        }));

        const { error: itemsError } = await supabase
          .from('order_items')
          .insert(itemsToInsert);

        if (itemsError) throw itemsError;
      }

      toast({
        title: "Sucesso",
        description: "Pedido atualizado com sucesso!"
      });

      onClose(true);
    } catch (error) {
      console.error('Erro ao atualizar pedido:', error);
      toast({
        title: "Erro",
        description: "Erro ao atualizar pedido. Tente novamente.",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  if (!orderData) return null;

  return (
    <Dialog open={isOpen} onOpenChange={() => onClose()}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Editar Pedido - {orderData.order_number}</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Cliente */}
          <div className="space-y-2">
            <Label>Cliente *</Label>
            <ClientSelector
              clients={clients}
              selectedClientId={formData.client_id}
              selectedClientName={formData.client_name}
              onClientSelect={handleClientSelect}
              open={openClientCombobox}
              setOpen={setOpenClientCombobox}
            />
          </div>

          {/* Vendedor (somente leitura) */}
          <div className="space-y-2">
            <Label>Vendedor</Label>
            <Input
              value={formData.seller_name}
              disabled
              className="bg-muted"
              placeholder="Vendedor do pedido"
            />
          </div>

          {/* Data de Entrega */}
          <div className="space-y-2">
            <Label>Data de Entrega</Label>
            <DateSelector
              selectedDate={formData.delivery_deadline}
              onDateSelect={handleDateSelect}
              open={openCalendar}
              setOpen={setOpenCalendar}
            />
          </div>

          {/* Métodos de Pagamento */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Método de Pagamento</Label>
              <Select
                value={formData.payment_method}
                onValueChange={(value) => setFormData(prev => ({ ...prev, payment_method: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione..." />
                </SelectTrigger>
                <SelectContent>
                  {paymentMethods.map((method) => (
                    <SelectItem key={method.id} value={method.name}>
                      {method.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Prazo de Pagamento</Label>
              <Select
                value={formData.payment_term}
                onValueChange={(value) => setFormData(prev => ({ ...prev, payment_term: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione..." />
                </SelectTrigger>
                <SelectContent>
                  {paymentTerms.map((term) => (
                    <SelectItem key={term.id} value={term.name}>
                      {term.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Itens do Pedido */}
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <Label>Itens do Pedido *</Label>
              <Button type="button" onClick={addItem} size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Adicionar Item
              </Button>
            </div>

            {items.map((item, index) => (
              <div key={index} className="grid grid-cols-1 md:grid-cols-5 gap-4 p-4 border rounded-lg">
                <div className="md:col-span-2">
                  <Label>Produto</Label>
                  <ProductSelector
                    products={products}
                    selectedProductId={item.product_id}
                    selectedProductName={item.product_name}
                    onProductSelect={(productId, productName, price) => 
                      handleProductSelect(index, productId, productName, price)
                    }
                    open={openProductCombobox[index] || false}
                    setOpen={(open) => setOpenProductComboboxForItem(index, open)}
                  />
                </div>

                <div>
                  <Label>Quantidade</Label>
                  <Input
                    type="number"
                    value={item.quantity}
                    onChange={(e) => updateItem(index, 'quantity', Number(e.target.value))}
                    min="1"
                  />
                </div>

                <div>
                  <Label>Preço Unitário</Label>
                  <Input
                    type="number"
                    value={item.unit_price}
                    onChange={(e) => updateItem(index, 'unit_price', Number(e.target.value))}
                    step="0.01"
                    min="0"
                  />
                </div>

                <div className="flex items-end gap-2">
                  <div className="flex-1">
                    <Label>Total</Label>
                    <Input
                      value={`R$ ${item.total_price.toFixed(2)}`}
                      disabled
                      className="bg-muted"
                    />
                  </div>
                  {items.length > 1 && (
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={() => removeItem(index)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Observações */}
          <div className="space-y-2">
            <Label>Observações</Label>
            <Textarea
              value={formData.notes}
              onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              placeholder="Observações adicionais..."
              rows={3}
            />
          </div>

          {/* Total */}
          <div className="flex justify-between items-center pt-4 border-t">
            <div className="text-lg font-semibold">
              Total: R$ {calculateTotal().toFixed(2)}
            </div>
            <div className="space-x-2">
              <Button variant="outline" onClick={() => onClose()}>
                Cancelar
              </Button>
              <Button 
                onClick={handleSave} 
                disabled={saving || items.length === 0 || !formData.client_id}
              >
                {saving ? "Salvando..." : "Salvar Alterações"}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};