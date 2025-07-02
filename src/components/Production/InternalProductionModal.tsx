import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface Product {
  id: string;
  name: string;
  stock: number;
}

interface InternalProductionModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const InternalProductionModal = ({ isOpen, onClose }: InternalProductionModalProps) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProduct, setSelectedProduct] = useState('');
  const [quantity, setQuantity] = useState('');
  const [isRecurrent, setIsRecurrent] = useState(false);
  const [recurrenceDays, setRecurrenceDays] = useState('1');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchManufacturedProducts();
    }
  }, [isOpen]);

  const fetchManufacturedProducts = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('products')
        .select('id, name, stock')
        .eq('is_manufactured', true)
        .eq('user_id', user.id)
        .order('name');

      if (error) throw error;
      setProducts(data || []);
    } catch (error) {
      console.error('Erro ao carregar produtos fabricados:', error);
      toast.error('Erro ao carregar produtos fabricados');
    }
  };

  const handleSubmit = async () => {
    if (!selectedProduct || !quantity || parseInt(quantity) <= 0) {
      toast.error('Preencha todos os campos corretamente');
      return;
    }

    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      const selectedProductData = products.find(p => p.id === selectedProduct);
      if (!selectedProductData) throw new Error('Produto não encontrado');

      // Criar produção interna
      const { error } = await supabase
        .from('production')
        .insert({
          user_id: user.id,
          product_id: selectedProduct,
          product_name: selectedProductData.name,
          quantity_requested: parseInt(quantity),
          quantity_produced: 0,
          status: 'pending',
          order_item_id: null, // Null para produção interna
          notes: `Produção interna${isRecurrent ? ` - Recorrente a cada ${recurrenceDays} dia(s)` : ''}`
        });

      if (error) throw error;

      toast.success('Produção interna criada com sucesso!');
      onClose();
      resetForm();
    } catch (error: any) {
      console.error('Erro ao criar produção interna:', error);
      toast.error('Erro ao criar produção interna: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setSelectedProduct('');
    setQuantity('');
    setIsRecurrent(false);
    setRecurrenceDays('1');
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Nova Produção Interna</DialogTitle>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          <div>
            <Label htmlFor="product">Produto</Label>
            <Select value={selectedProduct} onValueChange={setSelectedProduct}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione um produto fabricado" />
              </SelectTrigger>
              <SelectContent>
                {products.map((product) => (
                  <SelectItem key={product.id} value={product.id}>
                    {product.name} (Estoque: {product.stock})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <Label htmlFor="quantity">Quantidade a Produzir</Label>
            <Input 
              id="quantity" 
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              type="number"
              min="1"
              placeholder="Digite a quantidade"
            />
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="recurrent"
              checked={isRecurrent}
              onCheckedChange={setIsRecurrent}
            />
            <Label htmlFor="recurrent">Produção Recorrente</Label>
          </div>

          {isRecurrent && (
            <div>
              <Label htmlFor="recurrenceDays">Repetir a cada (dias)</Label>
              <Input 
                id="recurrenceDays" 
                value={recurrenceDays}
                onChange={(e) => setRecurrenceDays(e.target.value)}
                type="number"
                min="1"
                placeholder="1"
              />
            </div>
          )}
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={loading}>
            {loading ? 'Criando...' : 'Criar Produção'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};