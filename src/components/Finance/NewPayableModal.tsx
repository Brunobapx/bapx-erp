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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import VendorSelector from "./VendorSelector";
import { useActiveFinancialAccounts } from "@/hooks/useActiveFinancialAccounts";
import PayableRecurrenceFields from "./PayableRecurrenceFields";
import PayableBankAccountSelect from "./PayableBankAccountSelect";
import { useFinancialCategories } from "@/hooks/useFinancialCategories";

interface NewPayableModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

type Frequencia = "mensal" | "quinzenal" | "anual";

export const NewPayableModal = ({ isOpen, onClose, onSuccess }: NewPayableModalProps) => {
  const [formData, setFormData] = useState({
    supplier_name: '',
    description: '',
    amount: '',
    due_date: '',
    category: '', // inicia agora como string vazia
    invoice_number: '',
    notes: '',
    account: '', // nova linha, campo account
  });
  const [loading, setLoading] = useState(false);

  // Recorrência
  const [recorrente, setRecorrente] = useState(false);
  const [frequencia, setFrequencia] = useState<Frequencia>('mensal');
  const [qtdRepeticoes, setQtdRepeticoes] = useState(1);

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

  const [selectedVendorId, setSelectedVendorId] = useState<string | undefined>(undefined);
  const [selectedVendorName, setSelectedVendorName] = useState<string>("");

  // pega contas bancárias ativas
  const { accounts, loading: accountsLoading } = useActiveFinancialAccounts();

  useEffect(() => {
    // Reset vendor selection when closing/creating
    if (!isOpen) {
      setSelectedVendorId(undefined);
      setSelectedVendorName("");
    }
  }, [isOpen]);

  const handleVendorSelect = (id: string, name: string) => {
    setSelectedVendorId(id);
    setSelectedVendorName(name);
    setFormData((prev) => ({ ...prev, supplier_name: name }));
  };

  // Buscar categorias financeiras
  const { items: financialCategories, loading: categoriesLoading } = useFinancialCategories();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.supplier_name || !formData.description || !formData.amount || !formData.due_date) {
      toast.error('Preencha todos os campos obrigatórios');
      return;
    }

    // Validação simples para garantir campo valor é numérico
    if (isNaN(Number(formData.amount))) {
      toast.error('Digite um valor numérico válido');
      return;
    }

    if (!selectedVendorId) {
      toast.error('Selecione um fornecedor');
      return;
    }

    if (!formData.account) {
      toast.error('Selecione uma conta bancária');
      return;
    }

    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      let datas: Date[] = [new Date(formData.due_date)];
      let totalParcelas = 1;

      if (recorrente && qtdRepeticoes > 1) {
        datas = addPeriodo(new Date(formData.due_date), frequencia, qtdRepeticoes);
        totalParcelas = qtdRepeticoes;
      }

      const inserts = datas.map((date, idx) => {
        const parcelaLabel = totalParcelas > 1 
          ? ` - Parcela ${idx + 1}/${totalParcelas}` 
          : '';
        return {
          user_id: user.id,
          supplier_name: selectedVendorName,
          description: formData.description + parcelaLabel,
          amount: parseFloat(formData.amount),
          due_date: date.toISOString().slice(0, 10),
          category: formData.category,
          invoice_number: formData.invoice_number || null,
          notes: formData.notes || null,
          status: 'pending',
          account: formData.account,
        };
      });

      const { error } = await supabase
        .from('accounts_payable')
        .insert(inserts);
      if (error) throw error;

      toast.success('Conta a pagar criada com sucesso!');
      setFormData({
        supplier_name: '',
        description: '',
        amount: '',
        due_date: '',
        category: 'Compras',
        invoice_number: '',
        notes: '',
        account: '', // limpa conta também
      });
      onClose();
      if (onSuccess) onSuccess();

      // Reset recorrência
      setRecorrente(false);
      setQtdRepeticoes(1);
      setFrequencia('mensal');
    } catch (error: any) {
      console.error('Erro ao criar conta a pagar:', error);
      toast.error('Erro ao criar conta a pagar');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Nova Conta a Pagar</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="supplier">Fornecedor *</Label>
              <VendorSelector
                selectedVendorId={selectedVendorId}
                selectedVendorName={selectedVendorName}
                onSelect={handleVendorSelect}
              />
            </div>
            <div>
              <Label htmlFor="invoice">Número da NF/Documento</Label>
              <Input
                id="invoice"
                value={formData.invoice_number}
                onChange={(e) => setFormData({...formData, invoice_number: e.target.value})}
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
                onChange={(e) => setFormData({...formData, amount: e.target.value.replace(',', '.')})}
                placeholder="0,00"
                required
                autoComplete="off"
                pattern="[0-9]*[.,]?[0-9]*"
              />
            </div>
            <PayableBankAccountSelect
              value={formData.account}
              onValueChange={val => setFormData(f => ({ ...f, account: val }))}
            />
          </div>

          <div>
            <Label htmlFor="description">Descrição *</Label>
            <Input
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
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
                onChange={(e) => setFormData({...formData, due_date: e.target.value})}
                required
              />
            </div>
            <div>
              <Label htmlFor="category">Categoria *</Label>
              <Select
                value={formData.category}
                onValueChange={(value) =>
                  setFormData({ ...formData, category: value })
                }
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
              onChange={(e) => setFormData({...formData, notes: e.target.value})}
              placeholder="Observações adicionais..."
              rows={3}
            />
          </div>

          <PayableRecurrenceFields
            recorrente={recorrente}
            setRecorrente={setRecorrente}
            frequencia={frequencia}
            setFrequencia={setFrequencia}
            qtdRepeticoes={qtdRepeticoes}
            setQtdRepeticoes={setQtdRepeticoes}
          />

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Criando...' : 'Criar Conta'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
