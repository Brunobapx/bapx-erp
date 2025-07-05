import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useFinancialContext } from "@/contexts/FinancialContext";
import { useAuth } from '@/components/Auth/AuthProvider';

export function useConciliacoes() {
  const [criandoLancamento, setCriandoLancamento] = useState(false);
  const { refreshAllFinancialData } = useFinancialContext();
  const { user } = useAuth();

  async function conciliarComLancamento(transacaoId: string, lancamentoId: string) {
    setCriandoLancamento(true);
    try {
      console.log('Iniciando conciliação:', { transacaoId, lancamentoId });
      
      if (!user) {
        throw new Error('Usuário não autenticado');
      }
      
      // Buscar dados da transação e do lançamento
      const { data: transacao } = await supabase
        .from("extrato_bancario_importado")
        .select("*")
        .eq("id", transacaoId)
        .single();

      if (!transacao) {
        throw new Error("Transação não encontrada");
      }

      // Buscar lançamento financeiro
      const { data: lancamento } = await supabase
        .from("financial_entries")
        .select("*")
        .eq("id", lancamentoId)
        .single();

      if (!lancamento) {
        throw new Error("Lançamento não encontrado");
      }

      // Criar conciliação
      const { error: conciliacaoError } = await supabase
        .from("conciliacoes")
        .insert({
          id_transacao_banco: transacaoId,
          id_lancamento_interno: lancamentoId,
          tipo_lancamento: lancamento.type,
          metodo_conciliacao: "manual"
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
        .update({ payment_status: "paid", payment_date: transacao.data })
        .eq("id", lancamentoId);

      if (updateLancamentoError) throw updateLancamentoError;

      await refreshAllFinancialData();
      toast.success("Conciliação realizada com sucesso!");
      
    } catch (error: any) {
      console.error("Erro na conciliação:", error);
      toast.error(`Erro na conciliação: ${error.message}`);
    } finally {
      setCriandoLancamento(false);
    }
  }

  async function conciliarComNovoLancamento(
    transacaoId: string, 
    novoLancamento: {
      description: string;
      amount: number;
      type: 'receivable' | 'payable';
      category?: string;
    }
  ) {
    setCriandoLancamento(true);
    try {
      if (!user) {
        throw new Error('Usuário não autenticado');
      }

      // Buscar dados da transação
      const { data: transacao } = await supabase
        .from("extrato_bancario_importado")
        .select("*")
        .eq("id", transacaoId)
        .single();

      if (!transacao) {
        throw new Error("Transação não encontrada");
      }

      // Criar novo lançamento financeiro
      const { data: lancamento, error: lancamentoError } = await supabase
        .from("financial_entries")
        .insert({
          user_id: user.id,
          description: novoLancamento.description,
          amount: novoLancamento.amount,
          type: novoLancamento.type,
          category: novoLancamento.category,
          due_date: transacao.data,
          payment_date: transacao.data,
          payment_status: "paid"
        })
        .select()
        .single();

      if (lancamentoError) throw lancamentoError;

      // Criar conciliação
      const { error: conciliacaoError } = await supabase
        .from("conciliacoes")
        .insert({
          id_transacao_banco: transacaoId,
          id_lancamento_interno: lancamento.id,
          tipo_lancamento: novoLancamento.type,
          metodo_conciliacao: "criacao_automatica"
        });

      if (conciliacaoError) throw conciliacaoError;

      // Atualizar status da transação
      const { error: updateTransacaoError } = await supabase
        .from("extrato_bancario_importado")
        .update({ status: "conciliado" })
        .eq("id", transacaoId);

      if (updateTransacaoError) throw updateTransacaoError;

      await refreshAllFinancialData();
      toast.success("Lançamento criado e conciliação realizada com sucesso!");
      
    } catch (error: any) {
      console.error("Erro ao criar lançamento e conciliar:", error);
      toast.error(`Erro ao criar lançamento: ${error.message}`);
    } finally {
      setCriandoLancamento(false);
    }
  }

  async function desfazerConciliacao(transacaoId: string) {
    try {
      if (!user) {
        throw new Error('Usuário não autenticado');
      }
      
      // Buscar conciliação
      const { data: conciliacao, error: conciliacaoError } = await supabase
        .from("conciliacoes")
        .select("*")
        .eq("id_transacao_banco", transacaoId)
        .single();

      if (conciliacaoError || !conciliacao) {
        throw new Error("Conciliação não encontrada");
      }

      // Atualizar status do lançamento
      const { error: updateLancamentoError } = await supabase
        .from("financial_entries")
        .update({ payment_status: "pending", payment_date: null })
        .eq("id", conciliacao.id_lancamento_interno);

      if (updateLancamentoError) throw updateLancamentoError;

      // Atualizar status da transação
      const { error: updateTransacaoError } = await supabase
        .from("extrato_bancario_importado")
        .update({ status: "nao_conciliado" })
        .eq("id", transacaoId);

      if (updateTransacaoError) throw updateTransacaoError;

      // Remover conciliação
      const { error: deleteConciliacaoError } = await supabase
        .from("conciliacoes")
        .delete()
        .eq("id", conciliacao.id);

      if (deleteConciliacaoError) throw deleteConciliacaoError;

      await refreshAllFinancialData();
      toast.success("Conciliação desfeita com sucesso!");
      
    } catch (error: any) {
      console.error("Erro ao desfazer conciliação:", error);
      toast.error(`Erro ao desfazer conciliação: ${error.message}`);
    }
  }

  async function buscarLancamentosDisponiveis(
    tipo: 'entrada' | 'saida',
    valor?: number,
    dataInicio?: string,
    dataFim?: string
  ) {
    try {
      if (!user) {
        throw new Error('Usuário não autenticado');
      }

      const tipoFinanceiro = tipo === 'entrada' ? 'receivable' : 'payable';
      let query = supabase
        .from("financial_entries")
        .select("*")
        .eq("type", tipoFinanceiro)
        .eq("payment_status", "pending")
        .order("due_date", { ascending: false });

      // Filtros opcionais
      if (valor) {
        const margem = valor * 0.05; // 5% de margem
        query = query
          .gte("amount", valor - margem)
          .lte("amount", valor + margem);
      }

      if (dataInicio) {
        query = query.gte("due_date", dataInicio);
      }

      if (dataFim) {
        query = query.lte("due_date", dataFim);
      }

      const { data, error } = await query.limit(50);

      if (error) throw error;

      return data || [];
      
    } catch (error: any) {
      console.error("Erro ao buscar lançamentos:", error);
      toast.error(`Erro ao buscar lançamentos: ${error.message}`);
      return [];
    }
  }

  return {
    conciliarComLancamento,
    conciliarComNovoLancamento,
    desfazerConciliacao,
    buscarLancamentosDisponiveis,
    criandoLancamento
  };
}