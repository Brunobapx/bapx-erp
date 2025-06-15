import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { addPeriodo, formatDateToYYYYMMDD } from "./dateUtils";
import { useActiveFinancialAccounts } from "@/hooks/useActiveFinancialAccounts";
import { useFinancialCategories } from "@/hooks/useFinancialCategories";

type Frequencia = "mensal" | "quinzenal" | "anual";

// ATUALIZADO: incluído invoice_number no FormData
interface FormData {
  client: string;
  client_id: string; // id do cliente
  description: string;
  amount: string;
  due_date: string;
  category: string;
  account: string;
  notes: string;
  invoice_number: string; // Adicionado
}

export function useNewReceivableForm(onClose: () => void) {
  const [formData, setFormData] = useState<FormData>({
    client: '',
    client_id: '',
    description: '',
    amount: '',
    due_date: '',
    category: '',
    account: '',
    notes: '',
    invoice_number: '', // Adicionado
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [recorrente, setRecorrente] = useState(false);
  const [frequencia, setFrequencia] = useState<Frequencia>("mensal");
  const [qtdRepeticoes, setQtdRepeticoes] = useState(1);

  const { accounts, loading: loadingAccounts } = useActiveFinancialAccounts();
  const { items: categories, loading: categoriesLoading } = useFinancialCategories();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleClientSelect = (id: string, name: string) => {
    setFormData(prev => ({
      ...prev,
      client: name,
      client_id: id,
    }));
  };

  async function handleSubmit(e?: React.FormEvent) {
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
      let totalParcelas = 1;

      if (recorrente && qtdRepeticoes > 1) {
        datas = addPeriodo(new Date(formData.due_date), frequencia, qtdRepeticoes);
        totalParcelas = qtdRepeticoes;
      }

      const inserts = datas.map((date, idx) => {
        // Parcela X/Y
        const parcelaLabel = totalParcelas > 1 ? ` - Parcela ${idx + 1}/${totalParcelas}` : '';
        const invoiceSuffix = totalParcelas > 1 && formData.invoice_number
          ? `-${idx + 1}/${totalParcelas}`
          : '';

        return {
          user_id: user.id,
          client_id: formData.client_id,
          description: formData.description + parcelaLabel,
          amount: parseFloat(formData.amount),
          due_date: formatDateToYYYYMMDD(date),
          account: formData.account,
          category: formData.category,
          notes: formData.notes || null,
          type: "receivable",
          payment_status: "pending",
          invoice_number: formData.invoice_number
            ? (formData.invoice_number + invoiceSuffix)
            : null
        };
      });

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
  }

  function resetForm() {
    setFormData({
      client: '',
      client_id: '',
      description: '',
      amount: '',
      due_date: '',
      category: '',
      account: '',
      notes: '',
      invoice_number: '', // Adicionado
    });
    setRecorrente(false);
    setQtdRepeticoes(1);
    setFrequencia("mensal");
  }

  return {
    formData,
    setFormData,
    isSubmitting,
    handleChange,
    handleSubmit,
    handleClientSelect,
    resetForm,
    recorrente,
    setRecorrente,
    frequencia,
    setFrequencia,
    qtdRepeticoes,
    setQtdRepeticoes,
    accounts,
    loadingAccounts,
    categories,
    categoriesLoading,
  };
}
