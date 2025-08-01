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
import { ArrowLeft, Plus, Trash2 } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function SimpleOrderFormPage() {
  const navigate = useNavigate();
  const { createOrder, submitting } = useSimpleOrders();
  const { clients } = useClients();
  const { products } = useProducts();

  const [formData, setFormData] = useState<SimpleOrderFormData>({
    client_id: '',
    client_name: '',
    delivery_deadline: '',
    payment_method: '',
    payment_term: '',
    notes: '',
    items: [{ product_id: '', product_name: '', quantity: 1, unit_price: 0 }]
  });

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

  const handleClientSelect = (clientId: string) => {
    const client = clients.find(c => c.id === clientId);
    setFormData(prev => ({
      ...prev,
      client_id: clientId,
      client_name: client?.name || ''
    }));
  };

  const handleProductSelect = (index: number, productId: string) => {
    const product = products.find(p => p.id === productId);
    if (product) {
      updateItem(index, 'product_id', productId);
      updateItem(index, 'product_name', product.name);
      updateItem(index, 'unit_price', product.price || 0);
    }
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
            <Label htmlFor="client">Cliente *</Label>
            <Select value={formData.client_id} onValueChange={handleClientSelect}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione um cliente" />
              </SelectTrigger>
              <SelectContent>
                {clients.map(client => (
                  <SelectItem key={client.id} value={client.id}>
                    {client.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
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
                    <Select 
                      value={item.product_id} 
                      onValueChange={(value) => handleProductSelect(index, value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione um produto" />
                      </SelectTrigger>
                      <SelectContent>
                        {products.map(product => (
                          <SelectItem key={product.id} value={product.id}>
                            {product.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
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
            <div>
              <Label htmlFor="delivery_deadline">Prazo de Entrega</Label>
              <Input
                type="date"
                id="delivery_deadline"
                value={formData.delivery_deadline}
                onChange={(e) => setFormData(prev => ({ ...prev, delivery_deadline: e.target.value }))}
              />
            </div>
            
            <div>
              <Label htmlFor="payment_method">Método de Pagamento</Label>
              <Input
                id="payment_method"
                value={formData.payment_method}
                onChange={(e) => setFormData(prev => ({ ...prev, payment_method: e.target.value }))}
                placeholder="Ex: Cartão, Dinheiro, PIX"
              />
            </div>
            
            <div>
              <Label htmlFor="payment_term">Prazo de Pagamento</Label>
              <Input
                id="payment_term"
                value={formData.payment_term}
                onChange={(e) => setFormData(prev => ({ ...prev, payment_term: e.target.value }))}
                placeholder="Ex: À vista, 30 dias"
              />
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