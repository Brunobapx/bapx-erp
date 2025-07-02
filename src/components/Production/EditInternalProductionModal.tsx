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
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface Production {
  id: string;
  product_name: string;
  quantity_requested: number;
  quantity_produced: number;
  status: string;
  notes?: string;
}

interface EditInternalProductionModalProps {
  isOpen: boolean;
  onClose: () => void;
  production: Production | null;
  onUpdate: () => void;
}

export const EditInternalProductionModal = ({
  isOpen,
  onClose,
  production,
  onUpdate
}: EditInternalProductionModalProps) => {
  const [quantityProduced, setQuantityProduced] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (production) {
      setQuantityProduced(production.quantity_produced?.toString() || '0');
      setNotes(production.notes || '');
    }
  }, [production]);

  const handleSubmit = async () => {
    if (!production) return;

    const producedQty = parseInt(quantityProduced);
    if (isNaN(producedQty) || producedQty < 0) {
      toast.error('Quantidade produzida deve ser um número válido');
      return;
    }

    if (producedQty > production.quantity_requested) {
      toast.error('Quantidade produzida não pode ser maior que a solicitada');
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from('production')
        .update({
          quantity_produced: producedQty,
          notes: notes || null
        })
        .eq('id', production.id);

      if (error) throw error;

      toast.success('Produção atualizada com sucesso!');
      onUpdate();
      onClose();
    } catch (error: any) {
      console.error('Erro ao atualizar produção:', error);
      toast.error('Erro ao atualizar produção: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setQuantityProduced('');
    setNotes('');
    onClose();
  };

  if (!production) return null;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Editar Produção Interna</DialogTitle>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          <div>
            <Label>Produto</Label>
            <Input value={production.product_name} disabled />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Quantidade Solicitada</Label>
              <Input value={production.quantity_requested} disabled />
            </div>
            
            <div>
              <Label htmlFor="quantityProduced">Quantidade Produzida</Label>
              <Input 
                id="quantityProduced"
                value={quantityProduced}
                onChange={(e) => setQuantityProduced(e.target.value)}
                type="number"
                min="0"
                max={production.quantity_requested}
                placeholder="Digite a quantidade produzida"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="notes">Observações</Label>
            <Textarea 
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Informe perdas, falta de insumos ou outras observações..."
              rows={3}
            />
          </div>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={loading}>
            {loading ? 'Salvando...' : 'Salvar Alterações'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};