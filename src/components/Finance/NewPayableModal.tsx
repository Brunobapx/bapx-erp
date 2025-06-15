
import React, { useState } from 'react';
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
    category: 'Compras',
    invoice_number: '',
    notes: ''
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.supplier_name || !formData.description || !formData.amount || !formData.due_date) {
      toast.error('Preencha todos os campos obrigatórios');
      return;
    }

    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      let datas: Date[] = [new Date(formData.due_date)];
      if (recorrente && qtdRepeticoes > 1) {
        datas = addPeriodo(new Date(formData.due_date), frequencia, qtdRepeticoes);
      }

      const inserts = datas.map(date => ({
        user_id: user.id,
        supplier_name: formData.supplier_name,
        description: formData.description,
        amount: parseFloat(formData.amount),
        due_date: date.toISOString().slice(0, 10),
        category: formData.category,
        invoice_number: formData.invoice_number || null,
        notes: formData.notes || null,
        status: 'pending'
      }));

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
        notes: ''
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
              <Input
                id="supplier"
                value={formData.supplier_name}
                onChange={(e) => setFormData({...formData, supplier_name: e.target.value})}
                placeholder="Nome do fornecedor"
                required
              />
            </div>
            <div>
              <Label htmlFor="invoice">Número da NF</Label>
              <Input
                id="invoice"
                value={formData.invoice_number}
                onChange={(e) => setFormData({...formData, invoice_number: e.target.value})}
                placeholder="Número da nota fiscal"
              />
            </div>
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
              <Label htmlFor="amount">Valor *</Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                value={formData.amount}
                onChange={(e) => setFormData({...formData, amount: e.target.value})}
                placeholder="0,00"
                required
              />
            </div>
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
          </div>

          <div>
            <Label htmlFor="category">Categoria</Label>
            <Select value={formData.category} onValueChange={(value) => setFormData({...formData, category: value})}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Compras">Compras</SelectItem>
                <SelectItem value="Logística">Logística</SelectItem>
                <SelectItem value="Utilidades">Utilidades</SelectItem>
                <SelectItem value="Financiamento">Financiamento</SelectItem>
                <SelectItem value="Outros">Outros</SelectItem>
              </SelectContent>
            </Select>
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

          <div className="flex items-center gap-2 mt-2">
            <Switch checked={recorrente} onCheckedChange={setRecorrente} id="recorrente"/>
            <Label htmlFor="recorrente">Conta Recorrente?</Label>
          </div>

          {recorrente && (
            <div className="grid md:grid-cols-3 gap-3">
              <div>
                <Label htmlFor="freq">Frequência</Label>
                <Select value={frequencia} onValueChange={v => setFrequencia(v as Frequencia)}>
                  <SelectTrigger id="freq">
                    <SelectValue placeholder="Frequência" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="mensal">Mensal</SelectItem>
                    <SelectItem value="quinzenal">Quinzenal</SelectItem>
                    <SelectItem value="anual">Anual</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="repeticoes">Nº de repetições</Label>
                <Input
                  id="repeticoes"
                  type="number"
                  min={1}
                  value={qtdRepeticoes}
                  onChange={e => setQtdRepeticoes(Number(e.target.value))}
                  disabled={!recorrente}
                />
              </div>
            </div>
          )}

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
