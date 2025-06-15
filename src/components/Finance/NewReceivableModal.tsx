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
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useActiveFinancialAccounts } from "@/hooks/useActiveFinancialAccounts";
import ReceivableBankAccountSelect from "./ReceivableBankAccountSelect";
import ReceivableRecurrenceFields from "./ReceivableRecurrenceFields";
import { useFinancialCategories } from "@/hooks/useFinancialCategories";
import { DatePicker } from "@/components/ui/date-picker";
import ReceivableClientSelector from "./ReceivableClientSelector";

interface NewReceivableModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type Frequencia = "mensal" | "quinzenal" | "anual";

export const NewReceivableModal = ({ isOpen, onClose }: NewReceivableModalProps) => {
  const [formData, setFormData] = useState({
    client: '',
    client_id: '', // novo campo para armazenar o id selecionado do cliente
    description: '',
    amount: '',
    due_date: '',
    category: '',
    saleId: '',
    account: '',
    notes: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Recorrência
  const [recorrente, setRecorrente] = useState(false);
  const [frequencia, setFrequencia] = useState<Frequencia>("mensal");
  const [qtdRepeticoes, setQtdRepeticoes] = useState(1);

  const { accounts, loading: loadingAccounts } = useActiveFinancialAccounts();
  const { items: categories, loading: categoriesLoading } = useFinancialCategories();

  // Helper para datas de recorrência
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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    if (!formData.client_id || !formData.description || !formData.amount || !formData.due_date) {
      toast.error('Preencha todos os campos obrigatórios');
      return;
    }
    if (!formData.account) {
      toast.error("Selecione uma conta bancária!");
      return;
    }
    if (!formData.category) {
      toast.error("Selecione uma categoria!");
      return;
    }
    if (isNaN(Number(formData.amount))) {
      toast.error("Digite um valor numérico válido");
      return;
    }

    setIsSubmitting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      let datas: Date[] = [new Date(formData.due_date)];
      if (recorrente && qtdRepeticoes > 1) {
        datas = addPeriodo(new Date(formData.due_date), frequencia, qtdRepeticoes);
      }

      const inserts = datas.map(date => ({
        user_id: user.id,
        client_id: formData.client_id,
        description: formData.description,
        amount: parseFloat(formData.amount),
        due_date: date.toISOString().slice(0, 10),
        sale_id: formData.saleId || null,
        account: formData.account,
        category: formData.category,
        notes: formData.notes || null,
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
      client_id: '',
      description: '',
      amount: '',
      due_date: '',
      category: '',
      saleId: '',
      account: '',
      notes: '',
    });
    setRecorrente(false);
    setQtdRepeticoes(1);
    setFrequencia("mensal");
  };

  // Atualização ao selecionar cliente
  const handleClientSelect = (id: string, name: string) => {
    setFormData(prev => ({
      ...prev,
      client: name,
      client_id: id,
    }));
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Nova Cobrança</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block mb-1 font-medium">Cliente *</label>
              <ReceivableClientSelector
                selectedClientId={formData.client_id}
                selectedClientName={formData.client}
                onSelect={handleClientSelect}
              />
            </div>
            <div>
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
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="amount">Valor *</Label>
              <Input
                id="amount"
                name="amount"
                type="text"
                inputMode="decimal"
                value={formData.amount}
                onChange={e => setFormData({...formData, amount: e.target.value.replace(',', '.')})}
                placeholder="0,00"
                required
                autoComplete="off"
                pattern="[0-9]*[.,]?[0-9]*"
              />
            </div>
            <ReceivableBankAccountSelect
              value={formData.account}
              onValueChange={val => setFormData(f => ({ ...f, account: val }))}
            />
          </div>
          <div>
            <Label htmlFor="description">Descrição *</Label>
            <Input
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="Descrição da cobrança"
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="due_date">Vencimento *</Label>
              <DatePicker
                date={formData.due_date ? new Date(formData.due_date) : undefined}
                onDateChange={date => setFormData(f => ({ ...f, due_date: date ? date.toISOString().slice(0, 10) : '' }))}
                placeholder="Selecione a data"
                disabled={isSubmitting}
              />
            </div>
            <div>
              <Label htmlFor="category">Categoria *</Label>
              <Select
                value={formData.category}
                onValueChange={(value) => setFormData({ ...formData, category: value })}
                disabled={categoriesLoading}
              >
                <SelectTrigger>
                  <SelectValue placeholder={categoriesLoading ? "Carregando categorias..." : "Selecione a categoria"} />
                </SelectTrigger>
                <SelectContent>
                  {categories
                    .filter(cat => cat.type === "receita" && cat.is_active)
                    .map(cat => (
                      <SelectItem key={cat.id} value={cat.name}>
                        {cat.name}
                      </SelectItem>
                    ))
                  }
                </SelectContent>
              </Select>
            </div>
          </div>
          <div>
            <Label htmlFor="notes">Observações</Label>
            <Textarea
              id="notes"
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              placeholder="Observações adicionais..."
              rows={3}
            />
          </div>
          <ReceivableRecurrenceFields
            recorrente={recorrente}
            setRecorrente={setRecorrente}
            frequencia={frequencia}
            setFrequencia={setFrequencia}
            qtdRepeticoes={qtdRepeticoes}
            setQtdRepeticoes={setQtdRepeticoes}
          />
          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Criando...' : 'Criar Cobrança'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
