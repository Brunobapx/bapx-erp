
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useFinancialContext } from "@/contexts/FinancialContext";

export function useConciliacoes() {
  const [criandoLancamento, setCriandoLancamento] = useState(false);
  const { refreshAllFinancialData } = useFinancialContext();

  async function conciliarComLancamento(transacaoId: string, lancamentoId: string) {
    setCriandoLancamento(true);
    try {
      console.log('Iniciando conciliação:', { transacaoId, lancamentoId });
      
      // Buscar dados da transação e do lançamento
      const { data: transacao } = await supabase
        .from("extrato_bancario_importado")
        .select("*")
        .eq("id", transacaoId)
        .single();

      if (!transacao) {
        throw new Error("Transação não encontrada");
      }

      console.log('Transação encontrada:', transacao);

      // Tentar buscar primeiro em financial_entries
      let lancamento = null;
      let source = '';
      
      const { data: financialEntry } = await supabase
        .from("financial_entries")
        .select("*")
        .eq("id", lancamentoId)
        .single();

      if (financialEntry) {
        lancamento = financialEntry;
        source = 'financial_entries';
      } else {
        // Se não encontrou, buscar em accounts_payable
        const { data: payableEntry } = await supabase
          .from("accounts_payable")
          .select("*")
          .eq("id", lancamentoId)
          .single();
        
        if (payableEntry) {
          lancamento = payableEntry;
          source = 'accounts_payable';
        }
      }

      if (!lancamento) {
        throw new Error("Lançamento não encontrado");
      }

      console.log('Lançamento encontrado:', lancamento, 'source:', source);

      // CORRIGIR a verificação de compatibilidade de tipo
      let lancamentoType = '';
      if (source === 'financial_entries') {
        lancamentoType = lancamento.type;
      } else {
        lancamentoType = 'payable'; // accounts_payable são sempre payable
      }

      // CORRIGIR: débito é compatível com payable, crédito com receivable
      const tipoCompativel = (transacao.tipo === 'debito' && lancamentoType === 'payable') ||
                            (transacao.tipo === 'credito' && lancamentoType === 'receivable');
      
      if (!tipoCompativel) {
        console.warn(`Aviso: Tipo da transação (${transacao.tipo}) pode não ser compatível com o lançamento (${lancamentoType}), mas prosseguindo com a conciliação`);
        // REMOVER o throw error - permitir conciliação mesmo com tipos diferentes
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

      if (conciliacaoError) {
        console.error('Erro ao criar conciliação:', conciliacaoError);
        throw conciliacaoError;
      }

      // Atualizar status da transação
      const { error: updateTransacaoError } = await supabase
        .from("extrato_bancario_importado")
        .update({ status: "conciliado" })
        .eq("id", transacaoId);

      if (updateTransacaoError) {
        console.error('Erro ao atualizar transação:', updateTransacaoError);
        throw updateTransacaoError;
      }

      // Atualizar status do lançamento baseado na fonte
      if (source === 'financial_entries') {
        const { error: updateLancamentoError } = await supabase
          .from("financial_entries")
          .update({ 
            payment_status: "paid", 
            payment_date: transacao.data 
          })
          .eq("id", lancamentoId);

        if (updateLancamentoError) {
          console.error('Erro ao atualizar financial_entry:', updateLancamentoError);
          throw updateLancamentoError;
        }
      } else {
        const { error: updatePayableError } = await supabase
          .from("accounts_payable")
          .update({ 
            status: "paid", 
            payment_date: transacao.data 
          })
          .eq("id", lancamentoId);

        if (updatePayableError) {
          console.error('Erro ao atualizar accounts_payable:', updatePayableError);
          throw updatePayableError;
        }
      }

      toast.success("Transação conciliada com sucesso!");
      refreshAllFinancialData();

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
      console.log('Criando novo lançamento para conciliação:', transacao);
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado");

      // Determinar tipo correto: débito = saída = payable, crédito = entrada = receivable
      const entryType = transacao.tipo === 'credito' ? "receivable" : "payable";

      // Criar novo lançamento financeiro
      const { data: novoLancamento, error: lancamentoError } = await supabase
        .from("financial_entries")
        .insert([{
          user_id: user.id,
          type: entryType,
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

      if (lancamentoError) {
        console.error('Erro ao criar lançamento:', lancamentoError);
        throw lancamentoError;
      }

      console.log('Novo lançamento criado:', novoLancamento);

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
      console.log('Desconciliando transação:', transacaoId);
      
      // Buscar conciliação
      const { data: conciliacao } = await supabase
        .from("conciliacoes")
        .select("*")
        .eq("id_transacao_banco", transacaoId)
        .single();

      if (!conciliacao) {
        throw new Error("Conciliação não encontrada");
      }

      console.log('Conciliação encontrada:', conciliacao);

      // Tentar atualizar financial_entries primeiro
      const { data: financialEntry } = await supabase
        .from("financial_entries")
        .select("id")
        .eq("id", conciliacao.id_lancamento_interno)
        .single();

      if (financialEntry) {
        await supabase
          .from("financial_entries")
          .update({ 
            payment_status: "pending", 
            payment_date: null 
          })
          .eq("id", conciliacao.id_lancamento_interno);
      } else {
        // Se não encontrou em financial_entries, tentar accounts_payable
        await supabase
          .from("accounts_payable")
          .update({ 
            status: "pending", 
            payment_date: null 
          })
          .eq("id", conciliacao.id_lancamento_interno);
      }

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
      refreshAllFinancialData();

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
