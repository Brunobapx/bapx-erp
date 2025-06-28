
import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogFooter, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { DatePicker } from "@/components/ui/date-picker";
import ReceivableClientSelector from "./ReceivableClientSelector";
import ReceivableBankAccountSelect from "./ReceivableBankAccountSelect";
import { useFinancialCategories } from "@/hooks/useFinancialCategories";
import { parseLocalDateFromYYYYMMDD } from "./dateUtils";

type EditReceivableModalProps = {
  open: boolean;
  onClose: () => void;
  account: any;
  onSaved: () => void;
};

export const EditReceivableModal: React.FC<EditReceivableModalProps> = ({ 
  open, 
  onClose, 
  account, 
  onSaved 
}) => {
  const [formData, setFormData] = useState({
    client_id: "",
    client_name: "",
    description: "",
    amount: "",
    due_date: "",
    category: "",
    account: "",
    notes: "",
    invoice_number: ""
  });
  const [loading, setLoading] = useState(false);

  const { items: categories, loading: categoriesLoading } = useFinancialCategories();

  useEffect(() => {
    if (account && open) {
      setFormData({
        client_id: account.client_id || "",
        client_name: account.client || "",
        description: account.description || "",
        amount: account.amount?.toString() || "",
        due_date: account.dueDate || "",
        category: account.category || "",
        account: account.account || "",
        notes: account.notes || "",
        invoice_number: account.invoice_number || ""
      });
    }
  }, [account, open]);

  const handleClientSelect = (id: string, name: string) => {
    setFormData(prev => ({
      ...prev,
      client_id: id,
      client_name: name
    }));
  };

  const handleSave = async () => {
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

    setLoading(true);
    
    try {
      const { error } = await supabase
        .from("financial_entries")
        .update({
          client_id: formData.client_id,
          description: formData.description,
          amount: parseFloat(formData.amount),
          due_date: formData.due_date,
          category: formData.category,
          account: formData.account,
          notes: formData.notes || null,
          invoice_number: formData.invoice_number || null,
          updated_at: new Date().toISOString()
        })
        .eq("id", account.id);

      if (error) throw error;

      toast.success("Cobrança atualizada com sucesso!");
      onSaved();
      onClose();
    } catch (error: any) {
      console.error('Erro ao atualizar cobrança:', error);
      toast.error("Erro ao atualizar cobrança: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Editar Conta a Receber</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2 sm:col-span-1">
              <Label>Cliente *</Label>
              <ReceivableClientSelector
                selectedClientId={formData.client_id}
                selectedClientName={formData.client_name}
                onSelect={handleClientSelect}
              />
            </div>
            <div>
              <Label htmlFor="invoice_number">Número NF/Documento</Label>
              <Input
                id="invoice_number"
                value={formData.invoice_number}
                onChange={(e) => setFormData(prev => ({ ...prev, invoice_number: e.target.value }))}
                placeholder="Exemplo: 00001234"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="amount">Valor *</Label>
              <Input
                id="amount"
                type="text"
                inputMode="decimal"
                value={formData.amount}
                onChange={(e) => setFormData(prev => ({ ...prev, amount: e.target.value.replace(',', '.') }))}
                placeholder="0,00"
                required
                autoComplete="off"
                pattern="[0-9]*[.,]?[0-9]*"
              />
            </div>
            <div>
              <Label>Conta Bancária *</Label>
              <ReceivableBankAccountSelect
                value={formData.account}
                onValueChange={val => setFormData(prev => ({ ...prev, account: val }))}
              />
            </div>
          </div>

          <div>
            <Label htmlFor="description">Descrição *</Label>
            <Input
              id="description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
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
                  setFormData(prev => ({
                    ...prev,
                    due_date: date ? date.toISOString().slice(0, 10) : ''
                  }))
                }
                placeholder="Selecione a data"
                disabled={loading}
              />
            </div>
            <div>
              <Label htmlFor="category">Categoria *</Label>
              <Select
                value={formData.category}
                onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}
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
              value={formData.notes}
              onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              placeholder="Observações adicionais..."
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="secondary" onClick={onClose} disabled={loading}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={loading}>
            {loading ? "Salvando..." : "Salvar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
