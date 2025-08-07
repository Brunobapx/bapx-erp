import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useSimpleOrders, SimpleOrderFormData } from '@/hooks/useSimpleOrders';
import { useClients } from '@/hooks/useClients';
import { useProducts } from '@/hooks/useProducts';
import { usePaymentMethods } from '@/hooks/usePaymentMethods';
import { usePaymentTerms } from '@/hooks/usePaymentTerms';
import { useSellerUsers } from '@/hooks/useSellerUsers';
import { useAuth } from '@/components/Auth/AuthProvider';
import { ArrowLeft, Plus, Trash2 } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ClientSelector } from '@/components/Orders/ClientSelector';
import { ProductSelector } from '@/components/Orders/ProductSelector';
import { DateSelector } from '@/components/Orders/DateSelector';

export default function SimpleOrderFormPage() {
  const navigate = useNavigate();
  const { createOrder, submitting } = useSimpleOrders();
  const { clients } = useClients();
  const { products } = useProducts();
  const { items: paymentMethods } = usePaymentMethods();
  const { items: paymentTerms } = usePaymentTerms();
  const { sellers } = useSellerUsers();
  const { user, isSeller, userPosition } = useAuth();

  // Estados para controlar popovers/calendários
  const [openClientCombobox, setOpenClientCombobox] = useState(false);
  const [openProductCombobox, setOpenProductCombobox] = useState<Record<string, boolean>>({});
  const [openCalendar, setOpenCalendar] = useState(false);

  const [formData, setFormData] = useState<SimpleOrderFormData>({
    client_id: '',
    client_name: '',
    delivery_deadline: null,
    payment_method: '',
    payment_term: '',
    notes: '',
    seller_id: isSeller ? user?.id || '' : '',
    seller_name: isSeller ? `${user?.user_metadata?.first_name || ''} ${user?.user_metadata?.last_name || ''}`.trim() : '',
    items: [{ product_id: '', product_name: '', quantity: 1, unit_price: 0 }]
  });

  const setOpenProductComboboxForItem = (itemId: string, open: boolean) => {
    setOpenProductCombobox(prev => ({
      ...prev,
      [itemId]: open
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validação básica
    if (!formData.client_id || formData.items.length === 0) {
      alert('Preencha pelo menos o cliente e um item');
      return;
    }

    try {
      await createOrder(formData);
      navigate('/pedidos');
    } catch (error) {
      console.error('Erro ao criar pedido:', error);
    }
  };

  const addItem = () => {
    setFormData(prev => ({
      ...prev,
      items: [...prev.items, { product_id: '', product_name: '', quantity: 1, unit_price: 0 }]
    }));
  };

  const removeItem = (index: number) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index)
    }));
  };

  const updateItem = (index: number, field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.map((item, i) => 
        i === index ? { ...item, [field]: value } : item
      )
    }));
  };

  const handleClientSelect = (clientId: string, clientName: string) => {
    setFormData(prev => ({
      ...prev,
      client_id: clientId,
      client_name: clientName
    }));
  };

  const handleProductSelect = (index: number, productId: string, productName: string) => {
    const product = products.find(p => p.id === productId);
    if (product) {
      updateItem(index, 'product_id', productId);
      updateItem(index, 'product_name', productName);
      updateItem(index, 'unit_price', product.price || 0);
    }
  };

  const handleDateSelect = (date: Date | null) => {
    setFormData(prev => ({ ...prev, delivery_deadline: date }));
  };

  const handleSellerSelect = (sellerId: string) => {
    const seller = sellers.find(s => s.user_id === sellerId);
    setFormData(prev => ({
      ...prev,
      seller_id: sellerId,
      seller_name: seller?.display_name || ''
    }));
  };

  const totalAmount = formData.items.reduce((sum, item) => sum + (item.quantity * item.unit_price), 0);

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="flex items-center gap-4 mb-6">
        <Button variant="outline" onClick={() => navigate('/pedidos')}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-2xl font-bold">Novo Pedido</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Cliente */}
        <Card>
          <CardHeader>
            <CardTitle>Cliente</CardTitle>
          </CardHeader>
          <CardContent>
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
          </CardContent>
        </Card>

        {/* Itens */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Itens do Pedido</CardTitle>
            <Button type="button" onClick={addItem} size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Adicionar Item
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {formData.items.map((item, index) => (
                <div key={index} className="grid grid-cols-12 gap-4 items-end p-4 border rounded">
                  <div className="col-span-5">
                    <Label>Produto *</Label>
                    <ProductSelector 
                      products={products}
                      selectedProductId={item.product_id}
                      selectedProductName={item.product_name}
                      onProductSelect={(productId, productName) => handleProductSelect(index, productId, productName)}
                      open={openProductCombobox[`item-${index}`] || false}
                      setOpen={(open) => setOpenProductComboboxForItem(`item-${index}`, open)}
                    />
                  </div>
                  
                  <div className="col-span-2">
                    <Label>Quantidade *</Label>
                    <Input
                      type="number"
                      min="1"
                      value={item.quantity}
                      onChange={(e) => updateItem(index, 'quantity', parseInt(e.target.value) || 1)}
                    />
                  </div>
                  
                  <div className="col-span-2">
                    <Label>Preço Unit.</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={item.unit_price}
                      onChange={(e) => updateItem(index, 'unit_price', parseFloat(e.target.value) || 0)}
                    />
                  </div>
                  
                  <div className="col-span-2">
                    <Label>Total</Label>
                    <Input
                      type="text"
                      value={`R$ ${(item.quantity * item.unit_price).toFixed(2)}`}
                      disabled
                    />
                  </div>
                  
                  <div className="col-span-1">
                    {formData.items.length > 1 && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => removeItem(index)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
            
            <div className="mt-4 text-right">
              <div className="text-lg font-semibold">
                Total: R$ {totalAmount.toFixed(2)}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Informações Adicionais */}
        <Card>
          <CardHeader>
            <CardTitle>Informações Adicionais</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="seller">Vendedor *</Label>
              <Select 
                value={formData.seller_id}
                onValueChange={handleSellerSelect}
                disabled={isSeller}
              >
                <SelectTrigger>
                  <SelectValue 
                    placeholder="Selecione um vendedor"
                  >
                    {formData.seller_name || "Selecione um vendedor"}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {sellers.map((seller) => (
                    <SelectItem key={seller.user_id} value={seller.user_id}>
                      {seller.display_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {isSeller && (
                <p className="text-sm text-muted-foreground">Preenchido automaticamente (você é vendedor)</p>
              )}
            </div>

            <div className="grid gap-2">
              <Label htmlFor="delivery_deadline">Prazo de Entrega</Label>
              <DateSelector 
                selectedDate={formData.delivery_deadline}
                onDateSelect={handleDateSelect}
                open={openCalendar}
                setOpen={setOpenCalendar}
                label="Selecione a data de entrega"
              />
            </div>
            
            <div>
              <Label htmlFor="payment_method">Método de Pagamento</Label>
              <Select 
                value={formData.payment_method}
                onValueChange={(value) => setFormData(prev => ({ ...prev, payment_method: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a forma de pagamento" />
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
            
            <div>
              <Label htmlFor="payment_term">Prazo de Pagamento</Label>
              <Select 
                value={formData.payment_term}
                onValueChange={(value) => setFormData(prev => ({ ...prev, payment_term: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o prazo de pagamento" />
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
            
            <div>
              <Label htmlFor="notes">Observações</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                placeholder="Observações adicionais"
              />
            </div>
          </CardContent>
        </Card>

        {/* Ações */}
        <div className="flex justify-end gap-4">
          <Button type="button" variant="outline" onClick={() => navigate('/pedidos')}>
            Cancelar
          </Button>
          <Button type="submit" disabled={submitting}>
            {submitting ? 'Criando...' : 'Criar Pedido'}
          </Button>
        </div>
      </form>
    </div>
  );
}