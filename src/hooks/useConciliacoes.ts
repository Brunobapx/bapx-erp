
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export function useConciliacoes() {
  const [criandoLancamento, setCriandoLancamento] = useState(false);

  async function conciliarComLancamento(transacaoId: string, lancamentoId: string) {
    setCriandoLancamento(true);
    try {
      // Buscar dados da transação e do lançamento
      const { data: transacao } = await supabase
        .from("extrato_bancario_importado")
        .select("*")
        .eq("id", transacaoId)
        .single();

      const { data: lancamento } = await supabase
        .from("financial_entries")
        .select("*")
        .eq("id", lancamentoId)
        .single();

      if (!transacao || !lancamento) {
        throw new Error("Transação ou lançamento não encontrado");
      }

      // Verificar compatibilidade
      const tipoCompativel = (transacao.tipo === 'credito' && lancamento.type === 'receivable') ||
                            (transacao.tipo === 'debito' && lancamento.type === 'payable');
      
      if (!tipoCompativel) {
        throw new Error("Tipo da transação não é compatível com o lançamento");
      }

      // Inserir na tabela de conciliações
      const { error: conciliacaoError } = await supabase
        .from("conciliacoes")
        .insert({
          id_transacao_banco: transacaoId,
          id_lancamento_interno: lancamentoId,
          tipo_lancamento: transacao.tipo === 'credito' ? "conta_a_receber" : "conta_a_pagar",
          metodo_conciliacao: "manual",
        });

      if (conciliacaoError) throw conciliacaoError;

      // Atualizar status da transação
      const { error: updateTransacaoError } = await supabase
        .from("extrato_bancario_importado")
        .update({ status: "conciliado" })
        .eq("id", transacaoId);

      if (updateTransacaoError) throw updateTransacaoError;

      // Atualizar status do lançamento
      const { error: updateLancamentoError } = await supabase
        .from("financial_entries")
        .update({ 
          payment_status: "paid", 
          payment_date: transacao.data 
        })
        .eq("id", lancamentoId);

      if (updateLancamentoError) throw updateLancamentoError;

      toast.success("Transação conciliada com sucesso!");

    } catch (err: any) {
      console.error("Erro ao conciliar:", err);
      toast.error("Erro ao conciliar: " + err.message);
    } finally {
      setCriandoLancamento(false);
    }
  }

  async function conciliarCriandoLancamento(transacao: any) {
    setCriandoLancamento(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado");

      // Criar novo lançamento financeiro
      const { data: novoLancamento, error: lancamentoError } = await supabase
        .from("financial_entries")
        .insert([{
          user_id: user.id,
          type: transacao.valor > 0 ? "receivable" : "payable",
          description: transacao.descricao,
          amount: Math.abs(Number(transacao.valor)),
          due_date: transacao.data,
          payment_status: "paid",
          payment_date: transacao.data,
          account: "",
          notes: "Criado via conciliação bancária",
        }])
        .select("id")
        .single();

      if (lancamentoError) throw lancamentoError;

      // Agora conciliar com o novo lançamento
      await conciliarComLancamento(transacao.id, novoLancamento.id);

    } catch (err: any) {
      console.error("Erro ao criar e conciliar:", err);
      toast.error("Erro ao criar lançamento: " + err.message);
      setCriandoLancamento(false);
    }
  }

  async function desconciliar(transacaoId: string) {
    try {
      // Buscar conciliação
      const { data: conciliacao } = await supabase
        .from("conciliacoes")
        .select("*")
        .eq("id_transacao_banco", transacaoId)
        .single();

      if (!conciliacao) {
        throw new Error("Conciliação não encontrada");
      }

      // Atualizar status do lançamento para pendente
      await supabase
        .from("financial_entries")
        .update({ 
          payment_status: "pending", 
          payment_date: null 
        })
        .eq("id", conciliacao.id_lancamento_interno);

      // Atualizar status da transação
      await supabase
        .from("extrato_bancario_importado")
        .update({ status: "nao_conciliado" })
        .eq("id", transacaoId);

      // Remover conciliação
      await supabase
        .from("conciliacoes")
        .delete()
        .eq("id_transacao_banco", transacaoId);

      toast.success("Transação desconciliada com sucesso!");

    } catch (err: any) {
      console.error("Erro ao desconciliar:", err);
      toast.error("Erro ao desconciliar: " + err.message);
    }
  }

  return { 
    conciliarComLancamento,
    conciliarCriandoLancamento,
    desconciliar,
    criandoLancamento 
  };
}
