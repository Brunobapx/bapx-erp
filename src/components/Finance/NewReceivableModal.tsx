
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
import { DateSelector } from "@/components/Orders/DateSelector";
import { toast } from "sonner";

interface NewReceivableModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const NewReceivableModal = ({ isOpen, onClose }: NewReceivableModalProps) => {
  const [formData, setFormData] = useState({
    client: '',
    description: '',
    amount: '',
    saleId: ''
  });
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [isDateOpen, setIsDateOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async () => {
    if (!formData.client || !formData.description || !formData.amount || !selectedDate) {
      toast.error('Preencha todos os campos obrigatórios');
      return;
    }

    setIsSubmitting(true);
    try {
      // Aqui seria feita a integração com o backend
      console.log('Nova cobrança:', {
        ...formData,
        dueDate: selectedDate,
        amount: parseFloat(formData.amount)
      });
      
      toast.success('Cobrança criada com sucesso!');
      onClose();
      resetForm();
    } catch (error) {
      console.error('Erro ao criar cobrança:', error);
      toast.error('Erro ao criar cobrança');
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setFormData({
      client: '',
      description: '',
      amount: '',
      saleId: ''
    });
    setSelectedDate(null);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Nova Cobrança</DialogTitle>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="client">Cliente *</Label>
            <Input
              id="client"
              name="client"
              value={formData.client}
              onChange={handleChange}
              placeholder="Nome do cliente"
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="description">Descrição *</Label>
            <Textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="Descrição da cobrança"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="amount">Valor *</Label>
              <Input
                id="amount"
                name="amount"
                type="number"
                step="0.01"
                value={formData.amount}
                onChange={handleChange}
                placeholder="0,00"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="saleId">ID da Venda</Label>
              <Input
                id="saleId"
                name="saleId"
                value={formData.saleId}
                onChange={handleChange}
                placeholder="V-001"
              />
            </div>
          </div>

          <div className="grid gap-2">
            <Label>Data de Vencimento *</Label>
            <DateSelector
              selectedDate={selectedDate}
              onDateSelect={setSelectedDate}
              open={isDateOpen}
              setOpen={setIsDateOpen}
              label="Selecione a data de vencimento"
            />
          </div>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? 'Criando...' : 'Criar Cobrança'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
