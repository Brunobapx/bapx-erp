
import React, { useState } from 'react';
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
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface StockMovementModalProps {
  isOpen: boolean;
  onClose: (refresh?: boolean) => void;
  product: any;
  movementType: 'in' | 'out';
}

export const StockMovementModal = ({ 
  isOpen, 
  onClose, 
  product, 
  movementType 
}: StockMovementModalProps) => {
  const [quantity, setQuantity] = useState('');
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!quantity || parseFloat(quantity) <= 0) {
      toast.error('Informe uma quantidade válida');
      return;
    }

    if (!reason.trim()) {
      toast.error('Informe o motivo da movimentação');
      return;
    }

    setIsSubmitting(true);
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError || !user) {
        throw new Error('Usuário não autenticado');
      }

      const quantityNum = parseFloat(quantity);
      const currentStock = product.stock || 0;
      
      let newStock;
      if (movementType === 'in') {
        newStock = currentStock + quantityNum;
      } else {
        if (quantityNum > currentStock) {
          toast.error('Quantidade maior que o estoque disponível');
          return;
        }
        newStock = currentStock - quantityNum;
      }

      // Atualizar o estoque do produto
      const { error: updateError } = await supabase
        .from('products')
        .update({ 
          stock: newStock,
          updated_at: new Date().toISOString()
        })
        .eq('id', product.id)
        .eq('user_id', user.id);

      if (updateError) {
        throw updateError;
      }

      toast.success(
        movementType === 'in' 
          ? 'Entrada de estoque registrada com sucesso!' 
          : 'Saída de estoque registrada com sucesso!'
      );
      
      onClose(true);
      resetForm();
    } catch (error: any) {
      console.error('Erro ao atualizar estoque:', error);
      toast.error('Erro ao atualizar estoque');
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setQuantity('');
    setReason('');
  };

  const handleClose = () => {
    onClose();
    resetForm();
  };

  if (!product) return null;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {movementType === 'in' ? 'Entrada' : 'Saída'} de Estoque
          </DialogTitle>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label>Produto</Label>
            <Input
              value={`${product.code} - ${product.name}`}
              disabled
              className="bg-gray-50"
            />
          </div>

          <div className="grid gap-2">
            <Label>Estoque Atual</Label>
            <Input
              value={`${product.stock || 0} ${product.unit}`}
              disabled
              className="bg-gray-50"
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="quantity">
              Quantidade para {movementType === 'in' ? 'Entrada' : 'Saída'} *
            </Label>
            <Input
              id="quantity"
              type="number"
              step="0.01"
              min="0.01"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              placeholder="0,00"
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="reason">Motivo *</Label>
            <Textarea
              id="reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder={
                movementType === 'in' 
                  ? 'Ex: Compra de mercadoria, Devolução de cliente...' 
                  : 'Ex: Venda, Perda, Devolução ao fornecedor...'
              }
            />
          </div>

          {quantity && (
            <div className="grid gap-2">
              <Label>Novo Estoque</Label>
              <Input
                value={`${
                  movementType === 'in'
                    ? (product.stock || 0) + parseFloat(quantity || '0')
                    : (product.stock || 0) - parseFloat(quantity || '0')
                } ${product.unit}`}
                disabled
                className="bg-green-50 border-green-200"
              />
            </div>
          )}
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={isSubmitting}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? 'Salvando...' : 'Confirmar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
