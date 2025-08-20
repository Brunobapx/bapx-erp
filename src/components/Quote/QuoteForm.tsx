import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, Plus, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { useClients } from "@/hooks/useClients";
import { useProducts } from "@/hooks/useProducts";
import { usePaymentMethods } from "@/hooks/usePaymentMethods";
import { usePaymentTerms } from "@/hooks/usePaymentTerms";
import { useQuotes, Quote, QuoteItem } from "@/hooks/useQuotes";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface QuoteFormProps {
  quote?: Quote | null;
  onSave: () => void;
  onCancel: () => void;
}

interface FormData {
  client_id: string;
  client_name: string;
  client_email: string;
  client_phone: string;
  valid_until: Date;
  payment_method: string;
  payment_term: string;
  notes: string;
  discount_percentage: number;
  items: QuoteItem[];
}

export const QuoteForm = ({ quote, onSave, onCancel }: QuoteFormProps) => {
  const { allClients } = useClients();
  const { products } = useProducts();
  const { items: paymentMethods } = usePaymentMethods();
  const { items: paymentTerms } = usePaymentTerms();
  const { createQuote, updateQuote } = useQuotes();
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [items, setItems] = useState<QuoteItem[]>([]);
  const [subtotal, setSubtotal] = useState(0);
  const [discountAmount, setDiscountAmount] = useState(0);
  const [total, setTotal] = useState(0);

  const form = useForm<FormData>({
    defaultValues: {
      client_id: '',
      client_name: '',
      client_email: '',
      client_phone: '',
      valid_until: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
      payment_method: '',
      payment_term: '',
      notes: '',
      discount_percentage: 0,
      items: []
    }
  });

  useEffect(() => {
    if (quote) {
      form.reset({
        client_id: quote.client_id,
        client_name: quote.client_name,
        client_email: quote.client_email || '',
        client_phone: quote.client_phone || '',
        valid_until: new Date(quote.valid_until),
        payment_method: quote.payment_method || '',
        payment_term: quote.payment_term || '',
        notes: quote.notes || '',
        discount_percentage: quote.discount_percentage || 0,
        items: quote.items
      });
      setItems(quote.items);
    }
  }, [quote, form]);

  useEffect(() => {
    const newSubtotal = items.reduce((sum, item) => sum + item.total_price, 0);
    const discountPercentage = form.watch('discount_percentage') || 0;
    const newDiscountAmount = (newSubtotal * discountPercentage) / 100;
    const newTotal = newSubtotal - newDiscountAmount;

    setSubtotal(newSubtotal);
    setDiscountAmount(newDiscountAmount);
    setTotal(newTotal);
  }, [items, form.watch('discount_percentage')]);

  const addItem = () => {
    const newItem: QuoteItem = {
      id: `temp-${Date.now()}`,
      product_id: '',
      product_name: '',
      description: '',
      quantity: 1,
      unit_price: 0,
      total_price: 0
    };
    setItems([...items, newItem]);
  };

  const updateItem = (index: number, field: keyof QuoteItem, value: any) => {
    const updatedItems = [...items];
    updatedItems[index] = { ...updatedItems[index], [field]: value };
    
    if (field === 'quantity' || field === 'unit_price') {
      updatedItems[index].total_price = updatedItems[index].quantity * updatedItems[index].unit_price;
    }
    
    if (field === 'product_id') {
      const product = products.find(p => p.id === value);
      if (product) {
        updatedItems[index].product_name = product.name;
        updatedItems[index].unit_price = product.price || 0;
        updatedItems[index].total_price = updatedItems[index].quantity * (product.price || 0);
      }
    }
    
    setItems(updatedItems);
  };

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const handleClientChange = (clientId: string) => {
    const client = allClients.find(c => c.id === clientId);
    if (client) {
      form.setValue('client_id', clientId);
      form.setValue('client_name', client.name);
      form.setValue('client_email', client.email || '');
      form.setValue('client_phone', client.phone || '');
    }
  };

  const handleSubmit = async (data: FormData) => {
    if (items.length === 0) {
      toast.error('Adicione pelo menos um item ao orçamento');
      return;
    }

    setIsSubmitting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      const quoteData = {
        ...data,
        items, // Items will be handled separately in useQuotes
        subtotal,
        discount_amount: discountAmount,
        total_amount: total,
        status: 'draft' as const,
        valid_until: format(data.valid_until, 'yyyy-MM-dd'),
        user_id: user!.id,
        company_id: user!.id // Will be set by RLS/trigger
      };

      if (quote) {
        await updateQuote(quote.id, quoteData);
      } else {
        await createQuote(quoteData);
      }
      
      onSave();
    } catch (error) {
      console.error('Erro ao salvar orçamento:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Dados do Cliente</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="client">Cliente *</Label>
              <Select onValueChange={handleClientChange} value={form.watch('client_id')}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um cliente" />
                </SelectTrigger>
                <SelectContent>
                  {allClients.map((client) => (
                    <SelectItem key={client.id} value={client.id}>
                      {client.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="client_email">E-mail</Label>
                <Input
                  id="client_email"
                  {...form.register('client_email')}
                  placeholder="E-mail do cliente"
                />
              </div>
              <div>
                <Label htmlFor="client_phone">Telefone</Label>
                <Input
                  id="client_phone"
                  {...form.register('client_phone')}
                  placeholder="Telefone do cliente"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Condições</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Válido até *</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !form.watch('valid_until') && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {form.watch('valid_until') ? (
                      format(form.watch('valid_until'), "dd/MM/yyyy", { locale: ptBR })
                    ) : (
                      <span>Selecione uma data</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={form.watch('valid_until')}
                    onSelect={(date) => date && form.setValue('valid_until', date)}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="payment_method">Forma de Pagamento</Label>
                <Select onValueChange={(value) => form.setValue('payment_method', value)} value={form.watch('payment_method')}>
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
              <div>
                <Label htmlFor="payment_term">Prazo de Pagamento</Label>
                <Select onValueChange={(value) => form.setValue('payment_term', value)} value={form.watch('payment_term')}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    {paymentTerms.filter(pt => pt.is_active).map((term) => (
                      <SelectItem key={term.id} value={term.name}>
                        {term.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Itens do Orçamento</CardTitle>
          <Button type="button" onClick={addItem} size="sm" className="gap-2">
            <Plus className="h-4 w-4" />
            Adicionar Item
          </Button>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {items.map((item, index) => (
              <Card key={index} className="border-l-4 border-l-primary/20">
                <CardContent className="pt-4">
                  <div className="grid grid-cols-12 gap-4 items-end">
                    <div className="col-span-4">
                      <Label>Produto</Label>
                      <Select
                        value={item.product_id}
                        onValueChange={(value) => updateItem(index, 'product_id', value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione um produto" />
                        </SelectTrigger>
                        <SelectContent>
                          {products.map((product) => (
                            <SelectItem key={product.id} value={product.id}>
                              {product.name} - R$ {product.price?.toFixed(2)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="col-span-2">
                      <Label>Quantidade</Label>
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
                        min="0"
                        value={item.unit_price}
                        onChange={(e) => updateItem(index, 'unit_price', parseFloat(e.target.value) || 0)}
                      />
                    </div>
                    <div className="col-span-2">
                      <Label>Total</Label>
                      <Input
                        type="text"
                        value={`R$ ${item.total_price.toFixed(2)}`}
                        readOnly
                        className="bg-muted"
                      />
                    </div>
                    <div className="col-span-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => removeItem(index)}
                        className="w-full text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  <div className="mt-4">
                    <Label>Descrição (opcional)</Label>
                    <Textarea
                      value={item.description || ''}
                      onChange={(e) => updateItem(index, 'description', e.target.value)}
                      placeholder="Descrição detalhada do item"
                      rows={2}
                    />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <Separator className="my-6" />

          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label htmlFor="discount">Desconto (%)</Label>
                <Input
                  id="discount"
                  type="number"
                  step="0.01"
                  min="0"
                  max="100"
                  {...form.register('discount_percentage', { valueAsNumber: true })}
                />
              </div>
            </div>

            <div className="bg-muted/30 p-4 rounded-lg space-y-2">
              <div className="flex justify-between text-sm">
                <span>Subtotal:</span>
                <span>R$ {subtotal.toFixed(2)}</span>
              </div>
              {discountAmount > 0 && (
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>Desconto:</span>
                  <span>- R$ {discountAmount.toFixed(2)}</span>
                </div>
              )}
              <Separator />
              <div className="flex justify-between font-medium text-lg">
                <span>Total:</span>
                <span>R$ {total.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Observações</CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            {...form.register('notes')}
            placeholder="Observações, condições especiais, informações adicionais..."
            rows={4}
          />
        </CardContent>
      </Card>

      <div className="flex justify-end gap-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Salvando...' : quote ? 'Atualizar' : 'Criar Orçamento'}
        </Button>
      </div>
    </form>
  );
};