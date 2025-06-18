
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

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
    notes: ''
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (saleData && isOpen) {
      setFormData({
        payment_method: saleData.payment_method || '',
        payment_term: saleData.payment_term || '',
        notes: saleData.notes || ''
      });
    }
  }, [saleData, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!saleData?.id) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from('sales')
        .update({
          payment_method: formData.payment_method,
          payment_term: formData.payment_term,
          notes: formData.notes,
          updated_at: new Date().toISOString()
        })
        .eq('id', saleData.id);

      if (error) throw error;

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
      notes: ''
    });
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Editar Venda - {saleData?.sale_number}</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="payment_method">Método de Pagamento</Label>
            <Select
              value={formData.payment_method}
              onValueChange={(value) => setFormData({...formData, payment_method: value})}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione o método" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Dinheiro">Dinheiro</SelectItem>
                <SelectItem value="Cartão">Cartão</SelectItem>
                <SelectItem value="PIX">PIX</SelectItem>
                <SelectItem value="Boleto">Boleto</SelectItem>
                <SelectItem value="Transferência">Transferência</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="payment_term">Prazo de Pagamento</Label>
            <Select
              value={formData.payment_term}
              onValueChange={(value) => setFormData({...formData, payment_term: value})}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione o prazo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="À vista">À vista</SelectItem>
                <SelectItem value="7 dias">7 dias</SelectItem>
                <SelectItem value="15 dias">15 dias</SelectItem>
                <SelectItem value="30 dias">30 dias</SelectItem>
                <SelectItem value="45 dias">45 dias</SelectItem>
                <SelectItem value="60 dias">60 dias</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Observações</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData({...formData, notes: e.target.value})}
              placeholder="Observações adicionais..."
              rows={3}
            />
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Salvando...' : 'Salvar'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
