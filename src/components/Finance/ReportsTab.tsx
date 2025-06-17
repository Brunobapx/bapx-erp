
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, Download, Calendar, BarChart3, PieChart, TrendingUp, DollarSign, AlertTriangle } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useFinancialReports, type ReportType } from '@/hooks/useFinancialReports';

export const ReportsTab = () => {
  const [selectedReport, setSelectedReport] = useState<ReportType | ''>('');
  const [reportData, setReportData] = useState<any>(null);
  const { generateReport, exportToPDF, exportToExcel, loading } = useFinancialReports();

  const reports = [
    {
      id: 'cash-flow' as ReportType,
      title: 'Relatório de Fluxo de Caixa',
      description: 'Análise detalhada das entradas e saídas de caixa',
      icon: <TrendingUp className="h-5 w-5" />,
      type: 'Financeiro'
    },
    {
      id: 'dre' as ReportType,
      title: 'Demonstração do Resultado',
      description: 'DRE detalhada com receitas, custos e despesas',
      icon: <BarChart3 className="h-5 w-5" />,
      type: 'Financeiro'
    },
    {
      id: 'accounts-aging' as ReportType,
      title: 'Relatório de Aging',
      description: 'Análise de vencimento de contas a receber e pagar',
      icon: <Calendar className="h-5 w-5" />,
      type: 'Contas'
    },
    {
      id: 'profit-analysis' as ReportType,
      title: 'Análise de Rentabilidade',
      description: 'Relatório de margens e lucratividade por produto/cliente',
      icon: <PieChart className="h-5 w-5" />,
      type: 'Análise'
    },
    {
      id: 'tax-report' as ReportType,
      title: 'Relatório Fiscal',
      description: 'Informações para declarações e impostos',
      icon: <FileText className="h-5 w-5" />,
      type: 'Fiscal'
    },
    {
      id: 'budget-variance' as ReportType,
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

  const handleGenerateReport = async (reportType: ReportType) => {
    try {
      const data = await generateReport(reportType);
      setReportData(data);
      setSelectedReport(reportType);
    } catch (error) {
      console.error('Erro ao gerar relatório:', error);
    }
  };

  const renderReportContent = () => {
    if (!reportData || !selectedReport) {
      return (
        <div className="text-center py-8 text-muted-foreground">
          Selecione um relatório para visualizar os dados.
        </div>
      );
    }

    switch (selectedReport) {
      case 'cash-flow':
        return (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data</TableHead>
                <TableHead>Descrição</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead className="text-right">Valor</TableHead>
                <TableHead className="text-right">Saldo</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {reportData.map((item: any) => (
                <TableRow key={item.id}>
                  <TableCell>{new Date(item.date).toLocaleDateString('pt-BR')}</TableCell>
                  <TableCell>{item.description}</TableCell>
                  <TableCell>
                    <Badge variant={item.type === 'entrada' ? 'default' : 'destructive'}>
                      {item.type === 'entrada' ? 'Entrada' : 'Saída'}
                    </Badge>
                  </TableCell>
                  <TableCell className={`text-right ${item.type === 'entrada' ? 'text-green-600' : 'text-red-600'}`}>
                    R$ {item.amount.toLocaleString('pt-BR')}
                  </TableCell>
                  <TableCell className="text-right">R$ {item.balance.toLocaleString('pt-BR')}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        );

      case 'dre':
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <span>Receitas</span>
                    <span className="font-bold text-green-600">R$ {reportData.receitas.toLocaleString('pt-BR')}</span>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <span>Custos</span>
                    <span className="font-bold text-red-600">R$ {reportData.custos.toLocaleString('pt-BR')}</span>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <span>Despesas</span>
                    <span className="font-bold text-red-600">R$ {reportData.despesas.toLocaleString('pt-BR')}</span>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <span>Lucro Líquido</span>
                    <span className={`font-bold ${reportData.lucro_liquido >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      R$ {reportData.lucro_liquido.toLocaleString('pt-BR')}
                    </span>
                  </div>
                </CardContent>
              </Card>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <span>Margem Bruta</span>
                    <span className="font-bold">{reportData.margem_bruta.toFixed(2)}%</span>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <span>Margem Líquida</span>
                    <span className="font-bold">{reportData.margem_liquida.toFixed(2)}%</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        );

      case 'accounts-aging':
        return (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tipo</TableHead>
                <TableHead>Descrição</TableHead>
                <TableHead>Cliente/Fornecedor</TableHead>
                <TableHead className="text-right">Valor</TableHead>
                <TableHead>Vencimento</TableHead>
                <TableHead>Dias em Atraso</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {reportData.map((item: any) => (
                <TableRow key={item.id}>
                  <TableCell>
                    <Badge variant={item.type === 'receivable' ? 'default' : 'secondary'}>
                      {item.type === 'receivable' ? 'A Receber' : 'A Pagar'}
                    </Badge>
                  </TableCell>
                  <TableCell>{item.description}</TableCell>
                  <TableCell>{item.client_name}</TableCell>
                  <TableCell className="text-right">R$ {item.amount.toLocaleString('pt-BR')}</TableCell>
                  <TableCell>{new Date(item.due_date).toLocaleDateString('pt-BR')}</TableCell>
                  <TableCell>{item.days_overdue} dias</TableCell>
                  <TableCell>
                    <Badge variant={item.status === 'Vencido' ? 'destructive' : 'default'}>
                      {item.status}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        );

      case 'profit-analysis':
        return (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Cliente</TableHead>
                <TableHead className="text-right">Total Vendas</TableHead>
                <TableHead className="text-right">Total Custos</TableHead>
                <TableHead className="text-right">Lucro</TableHead>
                <TableHead className="text-right">Margem %</TableHead>
                <TableHead className="text-right">Pedidos</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {reportData.map((item: any, index: number) => (
                <TableRow key={index}>
                  <TableCell className="font-medium">{item.client_name}</TableCell>
                  <TableCell className="text-right">R$ {item.total_sales.toLocaleString('pt-BR')}</TableCell>
                  <TableCell className="text-right">R$ {item.total_cost.toLocaleString('pt-BR')}</TableCell>
                  <TableCell className={`text-right ${item.profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    R$ {item.profit.toLocaleString('pt-BR')}
                  </TableCell>
                  <TableCell className="text-right">
                    <Badge variant={item.margin > 20 ? 'default' : item.margin > 10 ? 'secondary' : 'destructive'}>
                      {item.margin.toFixed(1)}%
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">{item.orders_count}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        );

      case 'tax-report':
        return (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Período</TableHead>
                <TableHead className="text-right">Base de Cálculo</TableHead>
                <TableHead className="text-right">ICMS</TableHead>
                <TableHead className="text-right">IPI</TableHead>
                <TableHead className="text-right">PIS</TableHead>
                <TableHead className="text-right">COFINS</TableHead>
                <TableHead className="text-right">Total Impostos</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {reportData.map((item: any, index: number) => (
                <TableRow key={index}>
                  <TableCell className="font-medium">{new Date(item.period + '-01').toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}</TableCell>
                  <TableCell className="text-right">R$ {item.tax_base.toLocaleString('pt-BR')}</TableCell>
                  <TableCell className="text-right">R$ {item.icms.toLocaleString('pt-BR')}</TableCell>
                  <TableCell className="text-right">R$ {item.ipi.toLocaleString('pt-BR')}</TableCell>
                  <TableCell className="text-right">R$ {item.pis.toLocaleString('pt-BR')}</TableCell>
                  <TableCell className="text-right">R$ {item.cofins.toLocaleString('pt-BR')}</TableCell>
                  <TableCell className="text-right font-bold">R$ {item.total_taxes.toLocaleString('pt-BR')}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        );

      case 'budget-variance':
        return (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Categoria</TableHead>
                <TableHead className="text-right">Orçado</TableHead>
                <TableHead className="text-right">Realizado</TableHead>
                <TableHead className="text-right">Variação</TableHead>
                <TableHead className="text-right">Variação %</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {reportData.map((item: any, index: number) => (
                <TableRow key={index}>
                  <TableCell className="font-medium">{item.category}</TableCell>
                  <TableCell className="text-right">R$ {item.budgeted.toLocaleString('pt-BR')}</TableCell>
                  <TableCell className="text-right">R$ {item.actual.toLocaleString('pt-BR')}</TableCell>
                  <TableCell className={`text-right ${item.variance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    R$ {item.variance.toLocaleString('pt-BR')}
                  </TableCell>
                  <TableCell className="text-right">
                    <Badge variant={Math.abs(item.variance_percent) <= 10 ? 'default' : Math.abs(item.variance_percent) <= 25 ? 'secondary' : 'destructive'}>
                      {item.variance_percent.toFixed(1)}%
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        );

      default:
        return (
          <div className="text-center py-8 text-muted-foreground">
            Relatório em desenvolvimento.
          </div>
        );
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold">Relatórios e Análises</h2>
        <div className="flex gap-2">
          <Button variant="outline">
            <Calendar className="mr-2 h-4 w-4" /> Agendar Relatório
          </Button>
          {reportData && (
            <>
              <Button onClick={() => exportToPDF(reportData, selectedReport as string)}>
                <FileText className="mr-2 h-4 w-4" /> Exportar PDF
              </Button>
              <Button onClick={() => exportToExcel(reportData, selectedReport as string)} variant="outline">
                <Download className="mr-2 h-4 w-4" /> Exportar Excel
              </Button>
            </>
          )}
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
          <Card key={report.id} className="hover:shadow-md transition-shadow">
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
                <Button 
                  size="sm" 
                  className="flex-1" 
                  onClick={() => handleGenerateReport(report.id)}
                  disabled={loading}
                >
                  <FileText className="mr-2 h-4 w-4" /> 
                  {loading && selectedReport === report.id ? 'Gerando...' : 'Gerar'}
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => reportData && selectedReport === report.id && exportToPDF(reportData, report.id)}
                  disabled={!reportData || selectedReport !== report.id}
                >
                  <Download className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {(selectedReport || reportData) && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              {selectedReport && reports.find(r => r.id === selectedReport)?.title}
              {reportData && Array.isArray(reportData) && (
                <Badge variant="secondary">
                  {reportData.length} registros
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="max-h-96 overflow-auto">
              {renderReportContent()}
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Relatórios Recentes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[
              { name: 'DRE Junho 2025', date: '07/06/2025 14:30', size: '245 KB', type: 'PDF' },
              { name: 'Fluxo de Caixa Semanal', date: '06/06/2025 09:15', size: '187 KB', type: 'Excel' },
              { name: 'Aging de Contas', date: '05/06/2025 16:45', size: '156 KB', type: 'PDF' },
              { name: 'Análise de Rentabilidade', date: '04/06/2025 11:20', size: '298 KB', type: 'PDF' }
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
