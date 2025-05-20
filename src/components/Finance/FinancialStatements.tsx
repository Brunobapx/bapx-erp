
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { FileText, Download } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const FinancialStatements = () => {
  const { toast } = useToast();
  const [dateRange, setDateRange] = useState('month');
  
  const { data: transactions, isLoading } = useQuery({
    queryKey: ['transactions', dateRange],
    queryFn: async () => {
      try {
        // Get date range based on selection
        const today = new Date();
        let startDate;
        
        switch(dateRange) {
          case 'month':
            startDate = new Date(today.getFullYear(), today.getMonth(), 1);
            break;
          case 'quarter':
            const quarter = Math.floor(today.getMonth() / 3);
            startDate = new Date(today.getFullYear(), quarter * 3, 1);
            break;
          case 'year':
            startDate = new Date(today.getFullYear(), 0, 1);
            break;
          default:
            startDate = new Date(today.getFullYear(), today.getMonth(), 1);
        }
        
        // Format date for database query
        const formattedStartDate = startDate.toISOString().split('T')[0];
        const formattedEndDate = today.toISOString().split('T')[0];
        
        const { data, error } = await supabase
          .from('finance_transactions')
          .select('*')
          .gte('transaction_date', formattedStartDate)
          .lte('transaction_date', formattedEndDate);
          
        if (error) throw error;
        return data || [];
      } catch (error: any) {
        toast({
          title: "Erro ao carregar dados financeiros",
          description: error.message,
          variant: "destructive",
        });
        return [];
      }
    }
  });

  // Process data for DRE
  const calculateDRE = () => {
    if (!transactions) return { 
      income: 0, 
      expenses: 0, 
      grossProfit: 0, 
      netProfit: 0,
      incomeSources: {},
      expenseCategories: {} 
    };
    
    let income = 0;
    let expenses = 0;
    const incomeSources: Record<string, number> = {};
    const expenseCategories: Record<string, number> = {};
    
    transactions.forEach(transaction => {
      if (transaction.transaction_type === 'income') {
        income += Number(transaction.amount);
        const category = transaction.category || 'Sem categoria';
        incomeSources[category] = (incomeSources[category] || 0) + Number(transaction.amount);
      } 
      else if (transaction.transaction_type === 'expense') {
        expenses += Number(transaction.amount);
        const category = transaction.category || 'Sem categoria';
        expenseCategories[category] = (expenseCategories[category] || 0) + Number(transaction.amount);
      }
    });
    
    const grossProfit = income - expenses;
    // In a real DRE you'd have more items like taxes, etc.
    const netProfit = grossProfit; 
    
    return {
      income,
      expenses,
      grossProfit,
      netProfit,
      incomeSources,
      expenseCategories
    };
  };
  
  const dreData = calculateDRE();
  
  const formatDateRange = () => {
    const today = new Date();
    let startDate;
    
    switch(dateRange) {
      case 'month':
        startDate = new Date(today.getFullYear(), today.getMonth(), 1);
        return `${startDate.toLocaleDateString('pt-BR')} a ${today.toLocaleDateString('pt-BR')}`;
      case 'quarter':
        const quarter = Math.floor(today.getMonth() / 3);
        startDate = new Date(today.getFullYear(), quarter * 3, 1);
        return `${startDate.toLocaleDateString('pt-BR')} a ${today.toLocaleDateString('pt-BR')}`;
      case 'year':
        startDate = new Date(today.getFullYear(), 0, 1);
        return `${startDate.toLocaleDateString('pt-BR')} a ${today.toLocaleDateString('pt-BR')}`;
      default:
        return '';
    }
  };
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Relatórios Financeiros</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="dre" className="w-full">
          <div className="flex justify-between items-center mb-4">
            <TabsList>
              <TabsTrigger value="dre">DRE</TabsTrigger>
              <TabsTrigger value="cash-flow">Fluxo de Caixa</TabsTrigger>
              <TabsTrigger value="balance">Balanço</TabsTrigger>
            </TabsList>
            
            <div className="flex gap-2">
              <Button
                variant={dateRange === 'month' ? 'default' : 'outline'} 
                size="sm"
                onClick={() => setDateRange('month')}
              >
                Mês
              </Button>
              <Button
                variant={dateRange === 'quarter' ? 'default' : 'outline'} 
                size="sm"
                onClick={() => setDateRange('quarter')}
              >
                Trimestre
              </Button>
              <Button
                variant={dateRange === 'year' ? 'default' : 'outline'} 
                size="sm"
                onClick={() => setDateRange('year')}
              >
                Ano
              </Button>
            </div>
          </div>
          
          <TabsContent value="dre" className="mt-0">
            <div className="rounded-lg border overflow-hidden">
              <div className="bg-muted/50 p-4">
                <div className="flex justify-between items-center">
                  <h3 className="font-medium">Demonstração de Resultado do Exercício (DRE)</h3>
                  <Button variant="outline" size="sm">
                    <Download className="mr-2 h-4 w-4" />
                    Exportar
                  </Button>
                </div>
                <p className="text-sm text-muted-foreground">Período: {formatDateRange()}</p>
              </div>
              
              {isLoading ? (
                <div className="text-center p-8">Carregando relatório...</div>
              ) : (
                <div className="p-4">
                  <div className="space-y-4">
                    <div className="border-b pb-2">
                      <h4 className="font-bold mb-2">1. Receita Bruta</h4>
                      <div className="grid grid-cols-2 gap-2">
                        {Object.entries(dreData.incomeSources).map(([category, amount], index) => (
                          <div key={index} className="flex justify-between">
                            <span className="text-muted-foreground">{category}</span>
                            <span>R$ {amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                          </div>
                        ))}
                      </div>
                      <div className="flex justify-between font-medium mt-2">
                        <span>Total de Receitas</span>
                        <span>R$ {dreData.income.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                      </div>
                    </div>
                    
                    <div className="border-b pb-2">
                      <h4 className="font-bold mb-2">2. Despesas Operacionais</h4>
                      <div className="grid grid-cols-2 gap-2">
                        {Object.entries(dreData.expenseCategories).map(([category, amount], index) => (
                          <div key={index} className="flex justify-between">
                            <span className="text-muted-foreground">{category}</span>
                            <span>R$ {amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                          </div>
                        ))}
                      </div>
                      <div className="flex justify-between font-medium mt-2">
                        <span>Total de Despesas</span>
                        <span>R$ {dreData.expenses.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                      </div>
                    </div>
                    
                    <div className="border-b pb-2">
                      <div className="flex justify-between font-medium">
                        <span>3. Lucro Bruto (1 - 2)</span>
                        <span className={dreData.grossProfit >= 0 ? 'text-green-600' : 'text-red-600'}>
                          R$ {dreData.grossProfit.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                    </div>
                    
                    <div>
                      <div className="flex justify-between font-bold">
                        <span>Lucro/Prejuízo Líquido</span>
                        <span className={dreData.netProfit >= 0 ? 'text-green-600' : 'text-red-600'}>
                          R$ {dreData.netProfit.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                      
                      <div className="mt-4 bg-muted/30 p-3 rounded-md text-sm">
                        <FileText className="h-4 w-4 inline-block mr-2" />
                        <span>
                          Este relatório é uma versão simplificada da DRE. Em um ambiente de produção,
                          incluiria mais detalhes como impostos, amortizações e outros itens contábeis.
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </TabsContent>
          
          <TabsContent value="cash-flow" className="mt-0">
            <div className="text-center p-8 border rounded-lg">
              <h3 className="text-lg font-medium mb-2">Relatório de Fluxo de Caixa</h3>
              <p className="text-muted-foreground mb-4">
                Detalhamento completo de entradas e saídas no período selecionado.
              </p>
              <Button>
                <Download className="mr-2 h-4 w-4" />
                Gerar Relatório
              </Button>
            </div>
          </TabsContent>
          
          <TabsContent value="balance" className="mt-0">
            <div className="text-center p-8 border rounded-lg">
              <h3 className="text-lg font-medium mb-2">Balanço Patrimonial</h3>
              <p className="text-muted-foreground mb-4">
                Visão completa dos ativos e passivos da empresa.
              </p>
              <Button>
                <Download className="mr-2 h-4 w-4" />
                Gerar Balanço
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default FinancialStatements;
