import { useState } from 'react';
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { exportToPDF, exportToExcel } from "@/utils/reportExportUtils";

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

export interface TaxReport {
  period: string;
  icms: number;
  ipi: number;
  pis: number;
  cofins: number;
  iss: number;
  total_taxes: number;
  tax_base: number;
}

export interface BudgetVarianceReport {
  category: string;
  budgeted: number;
  actual: number;
  variance: number;
  variance_percent: number;
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

  const generateTaxReport = async (): Promise<TaxReport[]> => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      // Buscar vendas confirmadas para calcular impostos
      const { data: sales, error: salesError } = await supabase
        .from('sales')
        .select(`
          *,
          order_items(*)
        `)
        .eq('user_id', user.id)
        .eq('status', 'confirmed');

      if (salesError) throw salesError;

      const monthlyTaxes = new Map();

      (sales || []).forEach(sale => {
        const month = new Date(sale.created_at).toISOString().slice(0, 7);
        if (!monthlyTaxes.has(month)) {
          monthlyTaxes.set(month, {
            period: month,
            icms: 0,
            ipi: 0,
            pis: 0,
            cofins: 0,
            iss: 0,
            total_taxes: 0,
            tax_base: 0
          });
        }

        const monthData = monthlyTaxes.get(month);
        const saleAmount = Number(sale.total_amount);
        
        // Cálculo simplificado de impostos (18% ICMS, 5% IPI, 1.65% PIS, 7.6% COFINS)
        monthData.icms += saleAmount * 0.18;
        monthData.ipi += saleAmount * 0.05;
        monthData.pis += saleAmount * 0.0165;
        monthData.cofins += saleAmount * 0.076;
        monthData.tax_base += saleAmount;
        monthData.total_taxes = monthData.icms + monthData.ipi + monthData.pis + monthData.cofins + monthData.iss;
      });

      return Array.from(monthlyTaxes.values()).sort((a, b) => b.period.localeCompare(a.period));
    } catch (error: any) {
      console.error('Erro ao gerar relatório fiscal:', error);
      throw error;
    }
  };

  const generateBudgetVarianceReport = async (): Promise<BudgetVarianceReport[]> => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      // Orçamento fictício baseado em categorias
      const budgetData = [
        { category: 'Vendas', budgeted: 200000 },
        { category: 'Matéria Prima', budgeted: 60000 },
        { category: 'Despesas Administrativas', budgeted: 25000 },
        { category: 'Marketing', budgeted: 15000 },
        { category: 'Despesas Operacionais', budgeted: 20000 }
      ];

      // Buscar dados reais
      const { data: revenues, error: revenuesError } = await supabase
        .from('financial_entries')
        .select('amount, category')
        .eq('user_id', user.id)
        .eq('type', 'receivable')
        .eq('payment_status', 'paid');

      if (revenuesError) throw revenuesError;

      const { data: expenses, error: expensesError } = await supabase
        .from('accounts_payable')
        .select('amount, category')
        .eq('user_id', user.id)
        .eq('status', 'paid');

      if (expensesError) throw expensesError;

      // Calcular valores reais por categoria
      const actualData = new Map();
      
      // Receitas
      (revenues || []).forEach(item => {
        const category = item.category || 'Vendas';
        actualData.set(category, (actualData.get(category) || 0) + Number(item.amount));
      });

      // Despesas
      (expenses || []).forEach(item => {
        const category = item.category || 'Despesas Operacionais';
        actualData.set(category, (actualData.get(category) || 0) + Number(item.amount));
      });

      // Gerar relatório de variação
      return budgetData.map(budget => {
        const actual = actualData.get(budget.category) || 0;
        const variance = actual - budget.budgeted;
        const variance_percent = budget.budgeted > 0 ? (variance / budget.budgeted) * 100 : 0;

        return {
          category: budget.category,
          budgeted: budget.budgeted,
          actual,
          variance,
          variance_percent
        };
      });
    } catch (error: any) {
      console.error('Erro ao gerar relatório de orçado vs realizado:', error);
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
          data = await generateTaxReport();
          break;
        case 'budget-variance':
          data = await generateBudgetVarianceReport();
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

  const handleExportToPDF = (data: any, reportType: string) => {
    try {
      const reportNames: Record<string, string> = {
        'cash-flow': 'Relatório de Fluxo de Caixa',
        'dre': 'Demonstração do Resultado',
        'accounts-aging': 'Relatório de Aging',
        'profit-analysis': 'Análise de Rentabilidade',
        'tax-report': 'Relatório Fiscal',
        'budget-variance': 'Orçado vs Realizado'
      };

      exportToPDF(data, reportType, {
        title: reportNames[reportType] || 'Relatório Financeiro',
        subtitle: `Período: ${new Date().toLocaleDateString('pt-BR')}`
      });
      
      toast.success('Relatório PDF exportado com sucesso!');
    } catch (error) {
      console.error('Erro ao exportar PDF:', error);
      toast.error('Erro ao exportar relatório em PDF');
    }
  };

  const handleExportToExcel = (data: any, reportType: string) => {
    try {
      const reportNames: Record<string, string> = {
        'cash-flow': 'Relatório de Fluxo de Caixa',
        'dre': 'Demonstração do Resultado',
        'accounts-aging': 'Relatório de Aging',
        'profit-analysis': 'Análise de Rentabilidade',
        'tax-report': 'Relatório Fiscal',
        'budget-variance': 'Orçado vs Realizado'
      };

      exportToExcel(data, reportType, {
        title: reportNames[reportType] || 'Relatório Financeiro'
      });
      
      toast.success('Relatório Excel exportado com sucesso!');
    } catch (error) {
      console.error('Erro ao exportar Excel:', error);
      toast.error('Erro ao exportar relatório em Excel');
    }
  };

  return {
    generateReport,
    exportToPDF: handleExportToPDF,
    exportToExcel: handleExportToExcel,
    loading,
    error
  };
};
