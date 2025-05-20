
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, ResponsiveContainer, XAxis, YAxis, Bar, CartesianGrid, Tooltip, Legend } from 'recharts';
import { useQuery } from '@tanstack/react-query';
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const CashFlowChart = () => {
  const { toast } = useToast();
  
  const { data: cashFlowData, isLoading } = useQuery({
    queryKey: ['cashflow'],
    queryFn: async () => {
      try {
        const { data: transactions, error } = await supabase
          .from('finance_transactions')
          .select('*');
          
        if (error) throw error;
        
        // Process data for the chart
        const processedData = processTransactionsForChart(transactions || []);
        return processedData;
      } catch (error: any) {
        toast({
          title: "Erro ao carregar fluxo de caixa",
          description: error.message,
          variant: "destructive",
        });
        return [];
      }
    }
  });
  
  // Function to process transactions for the chart
  const processTransactionsForChart = (transactions: any[]) => {
    // Group transactions by month
    const groupedByMonth: Record<string, { month: string, income: number, expense: number }> = {};
    
    transactions.forEach(transaction => {
      const date = new Date(transaction.transaction_date);
      const monthYear = `${date.getMonth() + 1}/${date.getFullYear()}`;
      
      if (!groupedByMonth[monthYear]) {
        groupedByMonth[monthYear] = {
          month: monthYear,
          income: 0,
          expense: 0
        };
      }
      
      if (transaction.transaction_type === 'income') {
        groupedByMonth[monthYear].income += Number(transaction.amount);
      } else if (transaction.transaction_type === 'expense') {
        groupedByMonth[monthYear].expense += Number(transaction.amount);
      }
    });
    
    // Convert to array and sort by month
    return Object.values(groupedByMonth).sort((a, b) => {
      const [aMonth, aYear] = a.month.split('/');
      const [bMonth, bYear] = b.month.split('/');
      
      if (aYear === bYear) {
        return Number(aMonth) - Number(bMonth);
      }
      return Number(aYear) - Number(bYear);
    });
  };
  
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Fluxo de Caixa</CardTitle>
        </CardHeader>
        <CardContent className="h-80 flex items-center justify-center">
          <div className="animate-pulse">Carregando dados...</div>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Fluxo de Caixa</CardTitle>
      </CardHeader>
      <CardContent className="h-80">
        {cashFlowData && cashFlowData.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={cashFlowData}
              margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip formatter={(value) => `R$ ${Number(value).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`} />
              <Legend />
              <Bar dataKey="income" fill="#10b981" name="Receitas" />
              <Bar dataKey="expense" fill="#ef4444" name="Despesas" />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-full flex items-center justify-center text-muted-foreground">
            Nenhum dado disponível para exibição.
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default CashFlowChart;
