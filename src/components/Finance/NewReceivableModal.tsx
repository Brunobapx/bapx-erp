import React from 'react';
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
import ReceivableBankAccountSelect from "./ReceivableBankAccountSelect";
import ReceivableRecurrenceFields from "./ReceivableRecurrenceFields";
import { DatePicker } from "@/components/ui/date-picker";
import ReceivableClientSelector from "./ReceivableClientSelector";
import { useNewReceivableForm } from "./useNewReceivableForm";
import { parseLocalDateFromYYYYMMDD } from "./dateUtils";

interface NewReceivableModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const NewReceivableModal = ({ isOpen, onClose }: NewReceivableModalProps) => {
  const {
    formData,
    setFormData,
    isSubmitting,
    handleChange,
    handleSubmit,
    handleClientSelect,
    recorrente,
    setRecorrente,
    frequencia,
    setFrequencia,
    qtdRepeticoes,
    setQtdRepeticoes,
    categories,
    categoriesLoading
  } = useNewReceivableForm(onClose);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Nova Cobrança</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2 sm:col-span-1">
              <label className="block mb-1 font-medium">Cliente *</label>
              <ReceivableClientSelector
                selectedClientId={formData.client_id}
                selectedClientName={formData.client}
                onSelect={handleClientSelect}
              />
            </div>
            <div>
              <Label htmlFor="invoice_number">Número NF/Documento</Label>
              <Input
                id="invoice_number"
                name="invoice_number"
                value={formData.invoice_number}
                onChange={handleChange}
                placeholder="Exemplo: 00001234"
              />
            </div>
          </div>
          {/* Valor e Conta Bancária lado a lado */}
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
                date={parseLocalDateFromYYYYMMDD(formData.due_date)}
                onDateChange={date =>
                  setFormData(f => ({
                    ...f,
                    due_date: date ? date.toISOString().slice(0, 10) : ''
                  }))
                }
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
