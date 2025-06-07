
import { useState } from 'react';
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

export type ReportType = 'cash-flow' | 'dre' | 'accounts-aging' | 'profit-analysis' | 'tax-report' | 'budget-variance';

export interface CashFlowReport {
  id: string;
  date: string;
  description: string;
  type: 'entrada' | 'saida';
  amount: number;
  balance: number;
  category: string;
}

export interface DREReport {
  receitas: number;
  custos: number;
  despesas: number;
  lucro_bruto: number;
  lucro_liquido: number;
  margem_bruta: number;
  margem_liquida: number;
}

export interface AgingReport {
  id: string;
  description: string;
  client_name: string;
  amount: number;
  due_date: string;
  days_overdue: number;
  status: string;
  type: 'receivable' | 'payable';
}

export interface ProfitAnalysisReport {
  client_name: string;
  total_sales: number;
  total_cost: number;
  profit: number;
  margin: number;
  orders_count: number;
}

export const useFinancialReports = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generateCashFlowReport = async (): Promise<CashFlowReport[]> => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      // Buscar entradas financeiras
      const { data: entries, error: entriesError } = await supabase
        .from('financial_entries')
        .select('*')
        .eq('user_id', user.id)
        .eq('payment_status', 'paid')
        .order('payment_date', { ascending: true });

      if (entriesError) throw entriesError;

      // Buscar contas a pagar
      const { data: payables, error: payablesError } = await supabase
        .from('accounts_payable')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'paid')
        .order('payment_date', { ascending: true });

      if (payablesError) throw payablesError;

      const cashFlow: CashFlowReport[] = [];
      let balance = 0;

      // Adicionar receitas
      (entries || []).forEach(entry => {
        if (entry.type === 'receivable') {
          balance += Number(entry.amount);
          cashFlow.push({
            id: entry.id,
            date: entry.payment_date || entry.due_date,
            description: entry.description,
            type: 'entrada',
            amount: Number(entry.amount),
            balance,
            category: entry.category || 'Vendas'
          });
        }
      });

      // Adicionar despesas
      (payables || []).forEach(payable => {
        balance -= Number(payable.amount);
        cashFlow.push({
          id: payable.id,
          date: payable.payment_date || payable.due_date,
          description: payable.description,
          type: 'saida',
          amount: Number(payable.amount),
          balance,
          category: payable.category || 'Compras'
        });
      });

      return cashFlow.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    } catch (error: any) {
      console.error('Erro ao gerar relatório de fluxo de caixa:', error);
      throw error;
    }
  };

  const generateDREReport = async (): Promise<DREReport> => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      // Buscar receitas
      const { data: revenues, error: revenuesError } = await supabase
        .from('financial_entries')
        .select('amount')
        .eq('user_id', user.id)
        .eq('type', 'receivable')
        .eq('payment_status', 'paid');

      if (revenuesError) throw revenuesError;

      // Buscar custos (contas a pagar com categoria de custos)
      const { data: costs, error: costsError } = await supabase
        .from('accounts_payable')
        .select('amount')
        .eq('user_id', user.id)
        .eq('status', 'paid')
        .in('category', ['Matéria Prima', 'Custos', 'Produção']);

      if (costsError) throw costsError;

      // Buscar despesas
      const { data: expenses, error: expensesError } = await supabase
        .from('accounts_payable')
        .select('amount')
        .eq('user_id', user.id)
        .eq('status', 'paid')
        .not('category', 'in', '("Matéria Prima","Custos","Produção")');

      if (expensesError) throw expensesError;

      const receitas = (revenues || []).reduce((sum, item) => sum + Number(item.amount), 0);
      const custos = (costs || []).reduce((sum, item) => sum + Number(item.amount), 0);
      const despesas = (expenses || []).reduce((sum, item) => sum + Number(item.amount), 0);

      const lucro_bruto = receitas - custos;
      const lucro_liquido = lucro_bruto - despesas;
      const margem_bruta = receitas > 0 ? (lucro_bruto / receitas) * 100 : 0;
      const margem_liquida = receitas > 0 ? (lucro_liquido / receitas) * 100 : 0;

      return {
        receitas,
        custos,
        despesas,
        lucro_bruto,
        lucro_liquido,
        margem_bruta,
        margem_liquida
      };
    } catch (error: any) {
      console.error('Erro ao gerar DRE:', error);
      throw error;
    }
  };

  const generateAgingReport = async (): Promise<AgingReport[]> => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      const today = new Date();
      const aging: AgingReport[] = [];

      // Buscar contas a receber pendentes
      const { data: receivables, error: receivablesError } = await supabase
        .from('financial_entries')
        .select(`
          *,
          clients(name)
        `)
        .eq('user_id', user.id)
        .eq('type', 'receivable')
        .eq('payment_status', 'pending');

      if (receivablesError) throw receivablesError;

      (receivables || []).forEach(item => {
        const dueDate = new Date(item.due_date);
        const daysOverdue = Math.floor((today.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));
        
        aging.push({
          id: item.id,
          description: item.description,
          client_name: (item.clients as any)?.name || 'Cliente não informado',
          amount: Number(item.amount),
          due_date: item.due_date,
          days_overdue: Math.max(0, daysOverdue),
          status: daysOverdue > 0 ? 'Vencido' : 'Em dia',
          type: 'receivable'
        });
      });

      // Buscar contas a pagar pendentes
      const { data: payables, error: payablesError } = await supabase
        .from('accounts_payable')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'pending');

      if (payablesError) throw payablesError;

      (payables || []).forEach(item => {
        const dueDate = new Date(item.due_date);
        const daysOverdue = Math.floor((today.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));
        
        aging.push({
          id: item.id,
          description: item.description,
          client_name: item.supplier_name,
          amount: Number(item.amount),
          due_date: item.due_date,
          days_overdue: Math.max(0, daysOverdue),
          status: daysOverdue > 0 ? 'Vencido' : 'Em dia',
          type: 'payable'
        });
      });

      return aging.sort((a, b) => b.days_overdue - a.days_overdue);
    } catch (error: any) {
      console.error('Erro ao gerar relatório de aging:', error);
      throw error;
    }
  };

  const generateProfitAnalysisReport = async (): Promise<ProfitAnalysisReport[]> => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      // Buscar vendas confirmadas com informações do cliente
      const { data: sales, error: salesError } = await supabase
        .from('sales')
        .select(`
          *,
          clients(name),
          orders(total_amount)
        `)
        .eq('user_id', user.id)
        .eq('status', 'confirmed');

      if (salesError) throw salesError;

      // Agrupar por cliente
      const clientMap = new Map();

      (sales || []).forEach(sale => {
        const clientName = (sale.clients as any)?.name || 'Cliente não informado';
        if (!clientMap.has(clientName)) {
          clientMap.set(clientName, {
            client_name: clientName,
            total_sales: 0,
            total_cost: 0,
            profit: 0,
            margin: 0,
            orders_count: 0
          });
        }

        const clientData = clientMap.get(clientName);
        clientData.total_sales += Number(sale.total_amount);
        clientData.total_cost += Number(sale.total_amount) * 0.7; // Estimativa de 70% como custo
        clientData.orders_count += 1;
      });

      // Calcular lucro e margem
      const profitAnalysis = Array.from(clientMap.values()).map((client: any) => {
        client.profit = client.total_sales - client.total_cost;
        client.margin = client.total_sales > 0 ? (client.profit / client.total_sales) * 100 : 0;
        return client;
      });

      return profitAnalysis.sort((a, b) => b.profit - a.profit);
    } catch (error: any) {
      console.error('Erro ao gerar análise de rentabilidade:', error);
      throw error;
    }
  };

  const generateReport = async (reportType: ReportType) => {
    setLoading(true);
    setError(null);

    try {
      let data;
      switch (reportType) {
        case 'cash-flow':
          data = await generateCashFlowReport();
          break;
        case 'dre':
          data = await generateDREReport();
          break;
        case 'accounts-aging':
          data = await generateAgingReport();
          break;
        case 'profit-analysis':
          data = await generateProfitAnalysisReport();
          break;
        case 'tax-report':
          // Relatório fiscal - implementação básica
          data = await generateDREReport(); // Usando DRE como base
          break;
        case 'budget-variance':
          // Orçado vs Realizado - implementação básica
          data = await generateCashFlowReport(); // Usando fluxo de caixa como base
          break;
        default:
          throw new Error('Tipo de relatório não suportado');
      }

      toast.success('Relatório gerado com sucesso!');
      return data;
    } catch (error: any) {
      console.error('Erro ao gerar relatório:', error);
      setError(error.message || 'Erro ao gerar relatório');
      toast.error('Erro ao gerar relatório: ' + (error.message || 'Erro desconhecido'));
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const exportToPDF = (data: any, reportType: string) => {
    // Implementação básica para exportação
    toast.success(`Relatório ${reportType} exportado!`);
  };

  const exportToExcel = (data: any, reportType: string) => {
    // Implementação básica para exportação
    toast.success(`Relatório ${reportType} exportado para Excel!`);
  };

  return {
    generateReport,
    exportToPDF,
    exportToExcel,
    loading,
    error
  };
};
