
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, Download, Calendar, BarChart3, PieChart, TrendingUp } from 'lucide-react';

export const ReportsTab = () => {
  const [selectedReport, setSelectedReport] = useState('');

  const reports = [
    {
      id: 'cash-flow',
      title: 'Relatório de Fluxo de Caixa',
      description: 'Análise detalhada das entradas e saídas de caixa',
      icon: <TrendingUp className="h-5 w-5" />,
      type: 'Financeiro'
    },
    {
      id: 'dre',
      title: 'Demonstração do Resultado',
      description: 'DRE detalhada com receitas, custos e despesas',
      icon: <BarChart3 className="h-5 w-5" />,
      type: 'Financeiro'
    },
    {
      id: 'accounts-aging',
      title: 'Relatório de Aging',
      description: 'Análise de vencimento de contas a receber e pagar',
      icon: <Calendar className="h-5 w-5" />,
      type: 'Contas'
    },
    {
      id: 'profit-analysis',
      title: 'Análise de Rentabilidade',
      description: 'Relatório de margens e lucratividade por produto/cliente',
      icon: <PieChart className="h-5 w-5" />,
      type: 'Análise'
    },
    {
      id: 'tax-report',
      title: 'Relatório Fiscal',
      description: 'Informações para declarações e impostos',
      icon: <FileText className="h-5 w-5" />,
      type: 'Fiscal'
    },
    {
      id: 'budget-variance',
      title: 'Orçado vs Realizado',
      description: 'Comparativo entre valores orçados e realizados',
      icon: <BarChart3 className="h-5 w-5" />,
      type: 'Controle'
    }
  ];

  const quickStats = [
    { label: 'Relatórios Gerados', value: '47', period: 'Este mês' },
    { label: 'Último Backup', value: '2 horas', period: 'atrás' },
    { label: 'Dados Processados', value: '1.2GB', period: 'Total' },
    { label: 'Exportações', value: '23', period: 'Esta semana' }
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold">Relatórios e Análises</h2>
        <div className="flex gap-2">
          <Button variant="outline">
            <Calendar className="mr-2 h-4 w-4" /> Agendar Relatório
          </Button>
          <Button>
            <Download className="mr-2 h-4 w-4" /> Exportar Dados
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {quickStats.map((stat, index) => (
          <Card key={index}>
            <CardContent className="p-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-primary">{stat.value}</p>
                <p className="text-sm text-muted-foreground">{stat.label}</p>
                <p className="text-xs text-muted-foreground">{stat.period}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {reports.map((report) => (
          <Card key={report.id} className="hover:shadow-md transition-shadow cursor-pointer">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-md text-primary">
                  {report.icon}
                </div>
                <div>
                  <CardTitle className="text-base">{report.title}</CardTitle>
                  <p className="text-sm text-muted-foreground">{report.type}</p>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">{report.description}</p>
              <div className="flex gap-2">
                <Button size="sm" className="flex-1">
                  <FileText className="mr-2 h-4 w-4" /> Gerar
                </Button>
                <Button variant="outline" size="sm">
                  <Download className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Relatórios Recentes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[
              { name: 'DRE Maio 2025', date: '29/05/2025 14:30', size: '245 KB', type: 'PDF' },
              { name: 'Fluxo de Caixa Semanal', date: '28/05/2025 09:15', size: '187 KB', type: 'Excel' },
              { name: 'Aging de Contas', date: '27/05/2025 16:45', size: '156 KB', type: 'PDF' },
              { name: 'Análise de Rentabilidade', date: '26/05/2025 11:20', size: '298 KB', type: 'PDF' }
            ].map((file, index) => (
              <div key={index} className="flex items-center justify-between p-3 border rounded-md hover:bg-accent/50">
                <div className="flex items-center gap-3">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="font-medium">{file.name}</p>
                    <p className="text-sm text-muted-foreground">{file.date} • {file.size}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs bg-secondary px-2 py-1 rounded">{file.type}</span>
                  <Button variant="ghost" size="sm">
                    <Download className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
