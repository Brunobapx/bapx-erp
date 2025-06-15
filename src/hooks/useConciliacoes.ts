
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export function useConciliacoes() {
  const [criandoLancamento, setCriandoLancamento] = useState(false);

  // t: ExtratoTransacao
  async function conciliarManual(t: any, criarLancamento: boolean = false) {
    setCriandoLancamento(true);
    try {
      // Se criarLancamento, criar um novo lançamento financeiro
      let lancamentoId = null;
      if (criarLancamento) {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error("Usuário não autenticado");
        const { data, error } = await supabase
          .from("financial_entries")
          .insert([{
            user_id: user.id,
            type: t.valor > 0 ? "receivable" : "payable",
            description: t.descricao,
            amount: Math.abs(Number(t.valor)),
            due_date: t.data,
            payment_status: "paid",
            account: "",
            notes: "Criado via conciliação bancária",
          }]).select("id").single();
        if (error) throw error;
        lancamentoId = data.id;
      } else {
        // Usuário deverá selecionar um lançamento já existente (não implementado)
        toast.info("Selecione um lançamento do sistema para vincular (em breve)");
        setCriandoLancamento(false);
        return;
      }

      // Inserir na tabela de conciliações
      await supabase.from("conciliacoes").insert({
        id_transacao_banco: t.id,
        id_lancamento_interno: lancamentoId,
        tipo_lancamento: t.valor > 0 ? "conta_a_receber" : "conta_a_pagar",
        metodo_conciliacao: "manual",
      });

      // Atualizar o status da transação
      await supabase
        .from("extrato_bancario_importado")
        .update({ status: "conciliado" })
        .eq("id", t.id);

      toast.success("Transação conciliada!");

    } catch (err: any) {
      toast.error("Erro ao conciliar: " + err.message);
    } finally {
      setCriandoLancamento(false);
    }
  }

  return { conciliarManual, criandoLancamento };
}
