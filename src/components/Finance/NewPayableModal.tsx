
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DateSelector } from "@/components/Orders/DateSelector";
import { toast } from "sonner";

interface NewPayableModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const NewPayableModal = ({ isOpen, onClose }: NewPayableModalProps) => {
  const [formData, setFormData] = useState({
    supplier: '',
    description: '',
    amount: '',
    category: ''
  });
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [isDateOpen, setIsDateOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const categories = [
    'Compras',
    'Logística',
    'Utilidades',
    'Financiamento',
    'Pessoal',
    'Marketing',
    'Manutenção',
    'Outros'
  ];

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleCategoryChange = (value: string) => {
    setFormData(prev => ({ ...prev, category: value }));
  };

  const handleSubmit = async () => {
    if (!formData.supplier || !formData.description || !formData.amount || !formData.category || !selectedDate) {
      toast.error('Preencha todos os campos obrigatórios');
      return;
    }

    setIsSubmitting(true);
    try {
      // Aqui seria feita a integração com o backend
      console.log('Nova conta a pagar:', {
        ...formData,
        dueDate: selectedDate,
        amount: parseFloat(formData.amount)
      });
      
      toast.success('Conta criada com sucesso!');
      onClose();
      resetForm();
    } catch (error) {
      console.error('Erro ao criar conta:', error);
      toast.error('Erro ao criar conta');
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setFormData({
      supplier: '',
      description: '',
      amount: '',
      category: ''
    });
    setSelectedDate(null);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Nova Conta a Pagar</DialogTitle>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="supplier">Fornecedor *</Label>
            <Input
              id="supplier"
              name="supplier"
              value={formData.supplier}
              onChange={handleChange}
              placeholder="Nome do fornecedor"
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="description">Descrição *</Label>
            <Textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="Descrição da despesa"
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
              <Label>Categoria *</Label>
              <Select value={formData.category} onValueChange={handleCategoryChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione categoria" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map(category => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
            {isSubmitting ? 'Criando...' : 'Criar Conta'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
