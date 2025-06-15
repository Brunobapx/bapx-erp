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
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useActiveFinancialAccounts } from "@/hooks/useActiveFinancialAccounts";
import ReceivableBankAccountSelect from "./ReceivableBankAccountSelect";
import ReceivableRecurrenceFields from "./ReceivableRecurrenceFields";

interface NewReceivableModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type Frequencia = "mensal" | "quinzenal" | "anual";

export const NewReceivableModal = ({ isOpen, onClose }: NewReceivableModalProps) => {
  const [formData, setFormData] = useState({
    client: '',
    description: '',
    amount: '',
    saleId: '',
    account: '', // novo campo
  });
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [isDateOpen, setIsDateOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Campos de recorrência
  const [recorrente, setRecorrente] = useState(false);
  const [frequencia, setFrequencia] = useState<Frequencia>("mensal");
  const [qtdRepeticoes, setQtdRepeticoes] = useState(1);

  const { accounts, loading: loadingAccounts } = useActiveFinancialAccounts();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Helper para calcular próxima data
  function addPeriodo(date: Date, freq: Frequencia, times: number) {
    const result = [];
    let baseDate = new Date(date);
    for (let i = 0; i < times; i++) {
      result.push(new Date(baseDate));
      if (freq === "mensal") {
        baseDate.setMonth(baseDate.getMonth() + 1);
      } else if (freq === "quinzenal") {
        baseDate.setDate(baseDate.getDate() + 15);
      } else if (freq === "anual") {
        baseDate.setFullYear(baseDate.getFullYear() + 1);
      }
    }
    return result;
  }

  const handleSubmit = async () => {
    if (!formData.client || !formData.description || !formData.amount || !selectedDate) {
      toast.error('Preencha todos os campos obrigatórios');
      return;
    }
    if (!formData.account) {
      toast.error("Selecione uma conta bancária!");
      return;
    }

    setIsSubmitting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      let datas: Date[] = [selectedDate];
      if (recorrente && qtdRepeticoes > 1) {
        datas = addPeriodo(selectedDate, frequencia, qtdRepeticoes);
      }

      const inserts = datas.map(date => ({
        user_id: user.id,
        client: formData.client,
        description: formData.description,
        amount: parseFloat(formData.amount),
        due_date: date.toISOString().slice(0, 10),
        sale_id: formData.saleId || null,
        account: formData.account,
        type: "receivable",
        payment_status: "pending",
      }));

      const { error } = await supabase.from('financial_entries').insert(inserts);
      if (error) throw error;

      toast.success('Cobrança criada com sucesso!');
      onClose();
      resetForm();
    } catch (error: any) {
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
      saleId: '',
      account: ''
    });
    setSelectedDate(null);
    setRecorrente(false);
    setQtdRepeticoes(1);
    setFrequencia("mensal");
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Nova Cobrança</DialogTitle>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          {/* Cliente */}
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

          {/* Descrição */}
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

          {/* Valores */}
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

          {/* Conta bancária */}
          <ReceivableBankAccountSelect
            value={formData.account}
            onValueChange={val => setFormData(f => ({ ...f, account: val }))}
          />

          {/* Data de vencimento */}
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

          {/* Campos de recorrência */}
          <ReceivableRecurrenceFields
            recorrente={recorrente}
            setRecorrente={setRecorrente}
            frequencia={frequencia}
            setFrequencia={setFrequencia}
            qtdRepeticoes={qtdRepeticoes}
            setQtdRepeticoes={setQtdRepeticoes}
          />
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
