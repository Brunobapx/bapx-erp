
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useActiveFinancialAccounts } from "@/hooks/useActiveFinancialAccounts";
import { useFinancialCategories } from "@/hooks/useFinancialCategories";

export type Frequencia = "mensal" | "quinzenal" | "anual";

export function useNewPayableForm(isOpen: boolean, onClose: () => void, onSuccess?: () => void) {
  const [formData, setFormData] = useState({
    supplier_name: '',
    description: '',
    amount: '',
    due_date: '',
    category: '',
    invoice_number: '',
    notes: '',
    account: '',
  });

  const [loading, setLoading] = useState(false);
  const [recorrente, setRecorrente] = useState(false);
  const [frequencia, setFrequencia] = useState<Frequencia>('mensal');
  const [qtdRepeticoes, setQtdRepeticoes] = useState(1);

  const [selectedVendorId, setSelectedVendorId] = useState<string | undefined>(undefined);
  const [selectedVendorName, setSelectedVendorName] = useState<string>("");

  // Ativos
  const { accounts, loading: accountsLoading } = useActiveFinancialAccounts();
  const { items: financialCategories, loading: categoriesLoading } = useFinancialCategories();

  // Reset vendor selection ao fechar
  useEffect(() => {
    if (!isOpen) {
      setSelectedVendorId(undefined);
      setSelectedVendorName("");
    }
  }, [isOpen]);

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

  const handleVendorSelect = (id: string, name: string) => {
    setSelectedVendorId(id);
    setSelectedVendorName(name);
    setFormData((prev) => ({ ...prev, supplier_name: name }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.supplier_name || !formData.description || !formData.amount || !formData.due_date) {
      toast.error('Preencha todos os campos obrigatórios');
      return;
    }

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
        account: '',
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

  return {
    formData, setFormData, loading, handleSubmit,
    recorrente, setRecorrente, frequencia, setFrequencia, qtdRepeticoes, setQtdRepeticoes,
    selectedVendorId, selectedVendorName, handleVendorSelect,
    accounts, accountsLoading, financialCategories, categoriesLoading
  };
}
