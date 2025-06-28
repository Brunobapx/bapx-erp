
import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogFooter, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import VendorSelector from "./VendorSelector";
import PayableBankAccountSelect from "./PayableBankAccountSelect";
import { useFinancialCategories } from "@/hooks/useFinancialCategories";

type EditPayableModalProps = {
  open: boolean;
  onClose: () => void;
  account: any;
  onSaved: () => void;
};

export const EditPayableModal: React.FC<EditPayableModalProps> = ({ 
  open, 
  onClose, 
  account, 
  onSaved 
}) => {
  const [formData, setFormData] = useState({
    supplier_name: "",
    description: "",
    amount: "",
    due_date: "",
    category: "",
    account: "",
    notes: "",
    invoice_number: ""
  });
  const [selectedVendorId, setSelectedVendorId] = useState<string | undefined>(undefined);
  const [loading, setLoading] = useState(false);

  const { items: financialCategories, loading: categoriesLoading } = useFinancialCategories();

  useEffect(() => {
    if (account && open) {
      setFormData({
        supplier_name: account.supplier_name || "",
        description: account.description || "",
        amount: account.amount?.toString() || "",
        due_date: account.due_date || "",
        category: account.category || "",
        account: account.account || "",
        notes: account.notes || "",
        invoice_number: account.invoice_number || ""
      });
      // Reset vendor selection
      setSelectedVendorId(undefined);
    }
  }, [account, open]);

  const handleVendorSelect = (id: string, name: string) => {
    setSelectedVendorId(id);
    setFormData(prev => ({ ...prev, supplier_name: name }));
  };

  const handleSave = async () => {
    if (!formData.supplier_name || !formData.description || !formData.amount || !formData.due_date) {
      toast.error('Preencha todos os campos obrigatórios');
      return;
    }

    if (!formData.account) {
      toast.error('Selecione uma conta bancária');
      return;
    }

    if (isNaN(Number(formData.amount))) {
      toast.error('Digite um valor numérico válido');
      return;
    }

    setLoading(true);
    
    try {
      const { error } = await supabase
        .from("accounts_payable")
        .update({
          supplier_name: formData.supplier_name,
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

      toast.success("Conta a pagar atualizada com sucesso!");
      onSaved();
      onClose();
    } catch (error: any) {
      console.error('Erro ao atualizar conta a pagar:', error);
      toast.error("Erro ao atualizar conta a pagar: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Editar Conta a Pagar</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="supplier">Fornecedor *</Label>
              <VendorSelector
                selectedVendorId={selectedVendorId}
                selectedVendorName={formData.supplier_name}
                onSelect={handleVendorSelect}
              />
            </div>
            <div>
              <Label htmlFor="invoice">Número da NF/Documento</Label>
              <Input
                id="invoice"
                value={formData.invoice_number}
                onChange={(e) => setFormData(prev => ({ ...prev, invoice_number: e.target.value }))}
                placeholder="Número da NF/Documento"
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
              <PayableBankAccountSelect
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
              placeholder="Descrição da conta"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="due_date">Vencimento *</Label>
              <Input
                id="due_date"
                type="date"
                value={formData.due_date}
                onChange={(e) => setFormData(prev => ({ ...prev, due_date: e.target.value }))}
                required
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
                  {financialCategories
                    .filter(cat => cat.type === "despesa" && cat.is_active)
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
