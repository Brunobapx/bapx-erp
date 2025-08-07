
import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ShieldAlert, Percent, Edit, Package, Receipt } from 'lucide-react';
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useUserPositions } from "@/hooks/useUserPositions";
import { useAuth } from "@/components/Auth/AuthProvider";
import { usePaymentMethods } from "@/hooks/usePaymentMethods";
import { usePaymentTerms } from "@/hooks/usePaymentTerms";
import { OrderItemsSection } from "../Orders/Form/OrderItemsSection";
import { useOrderFormState } from "@/hooks/orders/useOrderFormState";
import { useOrderFormUI } from "@/hooks/orders/useOrderFormUI";

interface EditSaleModalProps {
  isOpen: boolean;
  onClose: (refresh?: boolean) => void;
  saleData: any;
}

export const EditSaleModal: React.FC<EditSaleModalProps> = ({
  isOpen,
  onClose,
  saleData
}) => {
  const [formData, setFormData] = useState({
    payment_method: '',
    payment_term: '',
    notes: '',
    discount_percentage: 0,
    discount_amount: 0
  });
  const [loading, setLoading] = useState(false);
  const [orderData, setOrderData] = useState(null);
  const [originalTotal, setOriginalTotal] = useState(0);
  const [hasOrderChanges, setHasOrderChanges] = useState(false);
  
  const { currentUserPosition } = useUserPositions();
  const { user } = useAuth();
  const { items: paymentMethods } = usePaymentMethods();
  const { items: paymentTerms } = usePaymentTerms();
  
  // Hook para gerenciar itens do pedido
  const {
    items,
    totalAmount,
    addItem,
    removeItem,
    updateItem,
    initializeFormData
  } = useOrderFormState(orderData);
  
  const {
    openProductCombobox,
    setOpenProductCombobox
  } = useOrderFormUI();

  // Verificar se usuário é gestor
  const isManager = currentUserPosition === 'gerente' || currentUserPosition === 'administrativo';
  
  // Verificar se venda pode ser editada
  const canEdit = saleData?.status !== 'confirmed' && saleData?.status !== 'invoiced' && saleData?.status !== 'delivered';
  
  // Carregar dados do pedido relacionado
  useEffect(() => {
    const fetchOrderData = async () => {
      if (saleData?.order_id && isOpen) {
        try {
          const { data: order, error } = await supabase
            .from('orders')
            .select(`
              *,
              order_items (
                id,
                product_id,
                product_name,
                quantity,
                unit_price,
                total_price
              )
            `)
            .eq('id', saleData.order_id)
            .single();

          if (error) throw error;
          
          setOrderData(order);
          setOriginalTotal(order.total_amount || 0);
          initializeFormData(order);
        } catch (error) {
          console.error('Erro ao carregar pedido:', error);
        }
      }
    };

    fetchOrderData();
  }, [saleData?.order_id, isOpen, initializeFormData]);

  useEffect(() => {
    if (saleData && isOpen) {
      setFormData({
        payment_method: saleData.payment_method || '',
        payment_term: saleData.payment_term || '',
        notes: saleData.notes || '',
        discount_percentage: saleData.discount_percentage || 0,
        discount_amount: saleData.discount_amount || 0
      });
    }
  }, [saleData, isOpen]);

  // Calcular total com desconto baseado nos itens atuais
  const currentItemsTotal = totalAmount || originalTotal;
  const finalTotal = Math.max(0, currentItemsTotal - formData.discount_amount);

  const handleDiscountPercentageChange = (percentage: number) => {
    const discountAmount = (currentItemsTotal * percentage) / 100;
    setFormData(prev => ({
      ...prev,
      discount_percentage: percentage,
      discount_amount: discountAmount
    }));
  };

  const handleDiscountAmountChange = (amount: number) => {
    const percentage = currentItemsTotal > 0 ? (amount / currentItemsTotal) * 100 : 0;
    setFormData(prev => ({
      ...prev,
      discount_percentage: percentage,
      discount_amount: amount
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!saleData?.id) return;

    if (!isManager) {
      toast.error('Apenas gestores podem editar vendas');
      return;
    }

    if (!canEdit) {
      toast.error('Esta venda não pode mais ser editada');
      return;
    }

    setLoading(true);
    try {
      // Atualizar venda com informações de desconto
      const { error: saleError } = await supabase
        .from('sales')
        .update({
          payment_method: formData.payment_method,
          payment_term: formData.payment_term,
          notes: formData.notes,
          discount_percentage: formData.discount_percentage,
          discount_amount: formData.discount_amount,
          original_amount: currentItemsTotal,
          total_amount: finalTotal,
          updated_at: new Date().toISOString()
        })
        .eq('id', saleData.id);

      if (saleError) throw saleError;

      // Atualizar pedido e itens
      if (orderData) {
        // Primeiro, deletar itens antigos
        const { error: deleteError } = await supabase
          .from('order_items')
          .delete()
          .eq('order_id', orderData.id);

        if (deleteError) throw deleteError;

        // Inserir novos itens
        if (items.length > 0) {
          const { error: itemsError } = await supabase
            .from('order_items')
            .insert(
              items.map(item => ({
                order_id: orderData.id,
                product_id: item.product_id,
                product_name: item.product_name,
                quantity: item.quantity,
                unit_price: item.unit_price,
                total_price: item.total_price,
                user_id: orderData.user_id
              }))
            );

          if (itemsError) throw itemsError;
        }

        // Atualizar totais do pedido
        const { error: orderError } = await supabase
          .from('orders')
          .update({
            payment_method: formData.payment_method,
            payment_term: formData.payment_term,
            notes: formData.notes,
            total_amount: currentItemsTotal,
            updated_at: new Date().toISOString()
          })
          .eq('id', orderData.id);

        if (orderError) throw orderError;
      }

      toast.success('Venda atualizada com sucesso');
      onClose(true);
    } catch (error: any) {
      console.error('Erro ao atualizar venda:', error);
      toast.error('Erro ao atualizar venda: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setFormData({
      payment_method: '',
      payment_term: '',
      notes: '',
      discount_percentage: 0,
      discount_amount: 0
    });
    setHasOrderChanges(false);
    onClose();
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  if (!isManager) {
    return (
      <Dialog open={isOpen} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ShieldAlert className="h-5 w-5 text-red-500" />
              Acesso Negado
            </DialogTitle>
          </DialogHeader>
          
          <div className="text-center py-6">
            <p className="text-muted-foreground">
              Apenas gestores e administradores podem editar vendas.
            </p>
          </div>
          
          <div className="flex justify-end">
            <Button onClick={handleClose}>Fechar</Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  if (!canEdit) {
    return (
      <Dialog open={isOpen} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ShieldAlert className="h-5 w-5 text-amber-500" />
              Venda Bloqueada
            </DialogTitle>
          </DialogHeader>
          
          <div className="text-center py-6">
            <p className="text-muted-foreground">
              Esta venda já foi aprovada e não pode mais ser editada.
            </p>
            <Badge variant="secondary" className="mt-2">
              Status: {saleData?.status}
            </Badge>
          </div>
          
          <div className="flex justify-end">
            <Button onClick={handleClose}>Fechar</Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Edit className="h-5 w-5" />
            Editar Venda - {saleData?.sale_number}
          </DialogTitle>
        </DialogHeader>
        
        <Tabs defaultValue="sale" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="sale" className="flex items-center gap-2">
              <Receipt className="h-4 w-4" />
              Venda
            </TabsTrigger>
            <TabsTrigger value="order" className="flex items-center gap-2">
              <Package className="h-4 w-4" />
              Pedido
            </TabsTrigger>
            <TabsTrigger value="discount" className="flex items-center gap-2">
              <Percent className="h-4 w-4" />
              Desconto
            </TabsTrigger>
          </TabsList>
          
          <form onSubmit={handleSubmit}>
            <TabsContent value="sale" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Informações da Venda</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Forma de Pagamento</Label>
                      <Select
                        value={formData.payment_method}
                        onValueChange={(value) => setFormData({...formData, payment_method: value})}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione" />
                        </SelectTrigger>
                        <SelectContent>
                          {paymentMethods.filter(pm => pm.is_active).map((method) => (
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
                        onValueChange={(value) => setFormData({...formData, payment_term: value})}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione" />
                        </SelectTrigger>
                        <SelectContent>
                          {paymentTerms.filter(pt => pt.is_active).map((term) => (
                            <SelectItem key={term.id} value={term.name}>
                              {term.name} ({term.days} dias)
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Observações</Label>
                    <Textarea
                      value={formData.notes}
                      onChange={(e) => setFormData({...formData, notes: e.target.value})}
                      placeholder="Observações adicionais..."
                      rows={3}
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="order" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Itens do Pedido</CardTitle>
                </CardHeader>
                <CardContent>
                  {orderData && (
                    <OrderItemsSection
                      items={items}
                      onAddItem={addItem}
                      onRemoveItem={removeItem}
                      onUpdateItem={(itemId, updates) => {
                        updateItem(itemId, updates);
                        setHasOrderChanges(true);
                      }}
                      openProductCombobox={openProductCombobox}
                      setOpenProductCombobox={setOpenProductCombobox}
                    />
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="discount" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Aplicar Desconto</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Desconto (%)</Label>
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        max="100"
                        value={formData.discount_percentage.toFixed(2)}
                        onChange={(e) => {
                          const value = parseFloat(e.target.value) || 0;
                          const rounded = Math.round(value * 100) / 100;
                          handleDiscountPercentageChange(rounded);
                        }}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Desconto (R$)</Label>
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        value={formData.discount_amount.toFixed(2)}
                        onChange={(e) => {
                          const value = parseFloat(e.target.value) || 0;
                          const rounded = Math.round(value * 100) / 100;
                          handleDiscountAmountChange(rounded);
                        }}
                      />
                    </div>
                  </div>

                  <Separator />

                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>Valor dos Itens:</span>
                      <span className="font-medium">{formatCurrency(currentItemsTotal)}</span>
                    </div>
                    <div className="flex justify-between text-red-600">
                      <span>Desconto:</span>
                      <span className="font-medium">-{formatCurrency(formData.discount_amount)}</span>
                    </div>
                    <div className="flex justify-between text-lg font-bold text-green-600">
                      <span>Total Final:</span>
                      <span>{formatCurrency(finalTotal)}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={handleClose}>
                Cancelar
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? 'Salvando...' : 'Salvar Alterações'}
              </Button>
            </div>
          </form>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};
